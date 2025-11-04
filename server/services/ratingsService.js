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
          // console.log(`🆕 Added IMDb ID ${imdbId} for ${content.name}`);
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
  if (data?.Response !== 'True' || !data?.imdbRating) {
    return { ok: false, reason: 'NO_RATING' };
  }

  const ratingVal = Number(data.imdbRating); // 0..10 scale
  const votes = Number(String(data.imdbVotes || '0').replace(/,/g, ''));

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
          matchedYear: data.Year ?? toYearMaybeInt32(content.year)
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
