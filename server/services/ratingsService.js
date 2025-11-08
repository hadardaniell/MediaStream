import fetch from 'node-fetch';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const OMDB_URL = 'https://www.omdbapi.com/';
const { OMDB_API_KEY } = process.env;

function normalizeImdbId(raw) {
  if (!raw) return null;
  // Accept full URLs or plain tt IDs
  const m = String(raw).match(/(tt\d{6,10})/i);
  return m ? m[1] : null;
}

function toYearMaybeInt32(y) {
  if (y == null) return '';
  // Handles BSON Int32, numbers, or strings
  if (typeof y?.valueOf === 'function') return y.valueOf();
  const n = Number(y);
  return Number.isFinite(n) ? n : '';
}

// Helper to normalize rating safely
function parseOmdbRating(raw) {
  // raw is often a string like "8.3" or "N/A"
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0; // default to 0 if missing/invalid
}

// Helper to normalize votes safely
function parseOmdbVotes(raw) {
  // raw can be "1,234,567" or "N/A"
  const n = Number(String(raw ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetches IMDb rating for one content item.
 * - If externalIds.imdb is missing, tries OMDb search by title & year, saves imdbID back to the doc, then fetches rating.
 * - Writes canonical `rating` (0..10) and `ratings.imdb` { value, votes, lastSync }.
 */
export async function syncImdbRatingForContent(contentId) {
  const db = await getDb();
  const _id = new ObjectId(String(contentId));
  const content = await db.collection('Content').findOne({ _id });
  if (!content) return { ok: false, reason: 'NOT_FOUND' };

  if (!OMDB_API_KEY) return { ok: false, reason: 'MISSING_OMDB_KEY' };

  // 1) Try existing imdb id
  let imdbId = normalizeImdbId(content?.externalIds?.imdb);

  // 2) 🔄 Fallback by title/year (auto-lookup and save)
  if (!imdbId && content.name) {
    const year = toYearMaybeInt32(content.year); // safe for Int32
    const searchUrl = `${OMDB_URL}?t=${encodeURIComponent(content.name)}&y=${year}&apikey=${OMDB_API_KEY}`;
    const searchResp = await fetch(searchUrl);
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData?.Response === 'True' && searchData.imdbID) {
        imdbId = normalizeImdbId(searchData.imdbID);
        if (imdbId) {
          await db.collection('Content').updateOne(
            { _id },
            { $set: { 'externalIds.imdb': imdbId } }
          );
        }
      }
    }
  }

  if (!imdbId) return { ok: false, reason: 'MISSING_IMDB_ID' };

  // 3) Fetch rating by imdb id
  const url = `${OMDB_URL}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) return { ok: false, reason: 'HTTP_' + resp.status };

  const data = await resp.json();
  if (data?.Response !== 'True') {
    // e.g., invalid ID or movie not found
    return { ok: false, reason: 'NO_TITLE_MATCH' };
  }

  // Normalize rating/votes: missing/invalid => 0
  const ratingVal = parseOmdbRating(data.imdbRating); // 0..10
  const votes = parseOmdbVotes(data.imdbVotes); // integer >= 0

  const now = new Date();
  const res = await db.collection('Content').updateOne(
    { _id },
    {
      $set: {
        rating: ratingVal,
        'ratings.imdb': {
          value: ratingVal,
          votes,
          lastSync: now,
          matchedTitle: data.Title ?? content.name,
          // OMDb Year can be "1999" or "1999–2007"; keep raw string for traceability
          matchedYear: data.Year ?? String(toYearMaybeInt32(content.year) || '')
        }
      }
    }
  );

  return {
    ok: true,
    matched: res.matchedCount,
    modified: res.modifiedCount,
    rating: ratingVal,
    votes
  };
}
