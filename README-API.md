# 📘 MediaStream2 API – Endpoints Cheat Sheet

**Base URL:** `http://localhost:3000`  
All requests and responses use JSON.  
Authentication is via a **session cookie (`sid`)** — always send requests with `credentials: 'include'` from the frontend.

---

## Auth API

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | Log in and start a session (sets `sid` cookie) |
| **GET** | `/api/auth/me` | Get the currently logged-in user |
| **POST** | `/api/auth/logout` | Log out (destroy session) |

---

## Content API

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/content` | Get all content (supports filters & sort) |
|  | └ `?type=movie\|series` – Filter by type |
|  | └ `?genre=[Action,Comedy]` – Filter by one or more genres (OR condition) |
|  | └ `?year=2020` – Filter by year |
|  | └ `?sortBy=rating\|year\|likes` – Sort results |
| **GET** | `/api/content/:id` | Get content by ID |
|  | └ `?include=episodes` – Include episodes (for series) |
|  | └ `?include=episodesCount` – Include season/episode counts |
| **GET** | `/api/content/profile/:profileId` | Get all content enriched with the given profile’s **likes** and **watch status** |
|  | └ Adds `hasLike` → `true` if profile liked this content |
|  | └ Adds `watch` → `{ status, progressSeconds, ... }` describing the profile’s viewing progress |
|  | └ Returns `"unstarted"` status if no watch record exists |
| **GET** | `/api/content/popular` | Get the most popular content based on **likes** and/or **rating** |
|  | └ `?mode=likes\|rating\|mixed` – Ranking mode (`mixed` combines both) |
|  | └ `?limit=10` – Limit the number of results (default 10) |
|  | └ `?type=movie\|series` – Filter by type |
|  | └ `?genre=[Action,Comedy]` – Filter by one or more genres (OR condition) |
|  | └ `?minRating=3.5` – Minimum rating threshold |
|  | └ `?wLikes=1&wRating=2` – Weights for likes/rating when `mode=mixed` |
| **GET** | `/api/content/popular/:profileId` | Get **popular content enriched with a specific profile’s likes & watches** |
|  | └ Same query params as `/popular` (mode, type, limit, genre, minRating, wLikes, wRating) |
|  | └ Adds `hasLike` → personalized like state |
|  | └ Adds `watch` → last watch progress & status (`completed`, `in-progress`, `unstarted`) |
|  | └ Ranking is identical to `/popular` but includes personal overlay |
| **POST** | `/api/content` | Create new content *(admin only)* |
| **POST** | `/api/content/series-with-episodes` | Create a **series** and its **episodes** in one call. |
|  | Body: `{ content: { ...series fields... }, episodes: [{ seasonNumber, episodeNumber, shortDescription, video }, ...] }` |
| **PATCH** | `/api/content/:id` | Update content *(admin only)* |
| **DELETE** | `/api/content/:id` | Delete content *(admin only)* |


---

## Episodes API

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/content/:contentId/episodes` | List episodes for a given content |
|  | └ `?season=1` – Filter by season number |
| **POST** | `/api/content/:contentId/episodes` | Create a single episode *(admin only)* |
| **POST** | `/api/content/:contentId/episodes/bulk` | Create multiple episodes at once *(admin only)* |
| **PATCH** | `/api/episodes/:id` | Update an episode *(admin only)* |
| **DELETE** | `/api/episodes/:id` | Delete an episode *(admin only)* |

---

## Users API

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/users` | Get all users *(admin only)* |
| **GET** | `/api/users/:id` | Get a user by ID *(self or admin)* |
| **PATCH** | `/api/users/:id` | Update a user *(self or admin)* |
| **DELETE** | `/api/users/:id` | Delete a user *(admin only)* |


## Profiles API
| Method     | Path                | Description                                                                                                         |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **GET**    | `/api/profiles`     | Get all profiles belonging to the logged-in user<br>→ Admins see **all profiles** (optionally `?userId=` to filter) |
| **GET**    | `/api/profiles/:id` | Get a single profile by ID<br>→ Allowed for the profile’s **owner** or an **admin**                                 |
| **POST**   | `/api/profiles`     | Create a new profile for the current user<br>→ Admins may specify `{ userId }` to create for another user           |
| **PATCH**  | `/api/profiles/:id` | Update a profile’s `name` or `photo`<br>→ Allowed for the profile’s **owner** or an **admin**                       |
| **DELETE** | `/api/profiles/:id` | Delete a profile<br>→ Allowed for the profile’s **owner** or an **admin**                                           |

## Likes API
| Method     | Path                                  | Description|
| ---------- | ------------------------------------- | -----------|
| **GET**    | `/api/likes`                          | Get all likes (optionally filter by `?profileId=` or `?contentId=`)<br>→ Returns an array of Like documents|
| **GET**    | `/api/likes/content/:contentId`       | Get all likes for a specific content|
| **GET**    | `/api/likes/profile/:profileId`       | Get all likes made by a specific profile|
| **GET**    | `/api/likes/content/:contentId/count` | Get the total number of likes for a specific content|
| **GET**    | `/api/likes/profile/:profileId/count` | Get the total number of likes made by a specific profile|
| **POST**   | `/api/likes`                          | Create a new like (`{ profileId, contentId }`)<br>→ Automatically increments `Content.likes` by **+1**|
| **DELETE** | `/api/likes`                          | Remove a like (`{ profileId, contentId }`)<br>→ Automatically decrements `Content.likes` by **–1** (idempotent)|
| **DELETE** | `/api/likes/:id`                      | Delete a like by its `_id`|
| **DELETE** | `/api/likes/profile/:profileId/all`   | Delete all likes belonging to a specific profile<br>→ Also decrements the `likes` count on each related content|

## Watches API

## Watches API

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/watches` | *(Admin only)* List all watch records<br>Supports filters: `?status=in_progress|completed`, `?profileId=`, `?contentId=`, `?limit=50`, `?cursor=` |
| **GET** | `/api/watches/:profileId` | Get all watch records for a specific profile |
|  | └ `?status=in_progress|completed` – Filter by status |
|  | └ `?include=content` – Include full content details for each record |
| **GET** | `/api/watches/:profileId/:contentId` | Get a single watch record for a specific profile–content pair<br>→ Returns `404` if not watched yet |
| **POST** | `/api/watches/progress` | Create or update in-progress watch record<br>→ Body: `{ profileId, contentId, progressSeconds, [seasonNumber], [episodeNumber] }`<br>→ For **series**, `seasonNumber` and `episodeNumber` are **required**<br>→ For **movies**, they must **not** be included |
| **POST** | `/api/watches/complete` | Mark a content as completed<br>→ Body: `{ profileId, contentId }` |
| **DELETE** | `/api/watches/:profileId/:contentId` | Remove (reset) a watch record – treated as “not started yet” |

## Uploads API

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/api/uploads/movie` | Upload a movie file (`.mp4`) to `client/assets/movies`.<br>→ **Body:** raw binary file (`Content-Type: application/octet-stream`)<br>→ **Header:** `X-Filename: <originalFileName>`<br>→ Returns: `{ ok, type, path, filename }` where `path` is the public URL (e.g. `/assets/movies/yourfile.mp4`) |
| **POST** | `/api/uploads/poster` | Upload a poster image (`.jpg`, `.png`, `.webp`) to `client/assets/posters`.<br>→ **Body:** raw binary file (`Content-Type: application/octet-stream`)<br>→ **Header:** `X-Filename: <originalFileName>`<br>→ Returns: `{ ok, type, path, filename }` where `path` is the public URL (e.g. `/assets/posters/yourfile.webp`) |
| **POST** | `/api/uploads/profile-photo` | Upload a profile photo (`.jpg`, `.png`, `.webp`) to `client/assets/profile-photos`.<br>→ **Body:** raw binary file (`Content-Type: application/octet-stream`)<br>→ **Header:** `X-Filename: <originalFileName>`<br>→ Returns: `{ ok, type, path, filename }` where `path` is the public URL (e.g. `/assets/profile-photos/avatar.png`) |
| **POST** | `/api/uploads/episode` | Upload an episode file for a specific series and season/episode number, 


### Manual Sync Rating

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/api/content/:id/sync-rating` | **Admin:** Sync rating for a single content item from OMDb (IMDb data). Updates `rating` (0–10) and `ratings.imdb` metadata. |
|  | └ `?source=imdb` – Data source (currently only `imdb`) |
|  | └ `?debug=true` – Include failure reason in response (helpful while testing) |
| **POST** | `/api/content/sync-ratings` | **Admin:** Batch sync ratings. Uses `externalIds.imdb` when present; can also auto-resolve by title/year if enabled in service. |
|  | └ `?source=imdb` – Data source (currently only `imdb`) |
|  | └ `?type=movie\|series` – Filter by type |
|  | └ `?genre=[Action,Comedy]` – Filter by one or more genres (OR condition) |
|  | └ `?ids=tt1375666,tt4154796` – Limit to specific IMDb IDs |
|  | └ `?includeMissingImdb=true` – Include items **without** IMDb ID (service tries title/year lookup and saves the ID) |



### Example cURL for Uploads
```bash
curl -i -X POST http://localhost:3000/api/uploads/poster \
  -H "Content-Type: application/octet-stream" \
  -H "X-Filename: test-poster.jpg" \
  --data-binary @/Users/asaf/Desktop/test-poster.jpg
```

---

## ⚙️ Notes

- **Admin access** is required for all create/update/delete routes.  
- **Error format:**  
  ```json
  { "error": "Message here" }
