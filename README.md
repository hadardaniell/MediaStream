MediaStream2 – README
1) Installation & Run Instructions

Prerequisites: Node.js (LTS), a MongoDB Atlas (or local MongoDB) connection string, and a modern browser.

Environment variables (create a .env file in the project root):

MONGO_URI – MongoDB connection string

OMDB_API_KEY – optional key used by parts of the content flow (if applicable)

Install dependencies in the repository root using your package manager (for example, npm install).

Start the server using the root start script (for example, npm start). The HTTP API and static client will be served from the same process (default port 3000).

Base URL: http://localhost:3000.

Static client assets are served from the server under /assets and HTML pages are routed by the server’s router to the files in client/components/....

2) Project Structure (Main Folders & Key Files)

Top-level:

server/ – Node.js + Express backend

server.js – main entry point (Express app, sessions, CORS, routes mounting, static files)

db.js – MongoDB connection (loads MONGO_URI, opens DisneyPlusDB)

router.js – routes HTML pages to client components (e.g., /login, /profiles, /feed, /search, /media-content/:id, /player/:id, /add-media, settings pages)

controllers/ – request handling logic per domain

authController.js, usersController.js, profilesController.js, contentController.js, episodesController.js, likesController.js, watchesController.js

routes/ – Express routers per domain (mounted under /api/...)

authRoutes.js, userRoutes.js, profilesRoutes.js, contentRoutes.js, episodesRoutes.js, likesRoutes.js, watchesRoutes.js, uploadRoutes.js

models/ – data-access layer for MongoDB collections

usersModel.js, profilesModel.js, contentModel.js, episodesModel.js, likesModel.js, watchesModel.js, logsModel.js

middlewares/ – cross-cutting middleware

requestLogger.js, errorLogger.js, plus auth and JSON enforcement where used

services/ – auxiliary services (if present)

scripts/ – maintenance scripts (e.g., recount likes)

tests/ – backend tests (if present)

client/ – static client (HTML, CSS, JS) served by the backend

components/ – page-level HTML for app screens (login, profiles, feed, search, media content, player, settings pages like edit-profile / manage-profiles / manage-account / statistics)

assets/ – UI images, posters, series assets, and styles.css

app.js, router.js – basic client-side scaffolding (where applicable)

README-API.md – API endpoints cheat sheet (developer-oriented reference)

package.json – root scripts (server start, maintenance scripts)

.env – environment variables file (do not commit secrets)

3) Main Functionality & Implemented Features

Authentication & Sessions

User registration and login, session management via an sid cookie using express-session.

requireAuth middleware protects domain routes as needed; role checks for admin endpoints where applicable.

Profiles

Multiple profiles under a single user; profile management screens in the client (settings pages).

Endpoints to create, list, update, and manage profiles.

Content (Movies & Series)

CRUD for content items with validation of required fields (name, type, year, genres, description, photo).

Support for series metadata and relations to episodes.

Query support for filters such as type and genres (including OR queries over multiple genres).

Episodes (for Series)

Creation and listing of episodes associated with a series (contentId).

Bulk creation utilities and per-series episode retrieval.

Optional computed fields (e.g., episodes count, seasons derived from episode data) when requested.

Watches / Progress Tracking

Per-profile watch progress (season/episode position for series; completion state for movies).

Validation on updates to prevent invalid season/episode indices relative to the content.

Endpoints to upsert progress, mark completed, reset state, and query by profile/content.

Likes / Popularity

Per-profile likes for content; aggregation scripts to recount likes when needed.

Popular content queries and related endpoints.

Uploads

Backend endpoints for uploading and serving assets (movies, posters, profile pictures, series episodes).

File path conventions under client/assets/... (e.g., posters and series episode paths), and static serving via /assets.

Logging & Error Handling

Request logging middleware (narrowed to API and selected HTTP methods if configured).

Error logging middleware and consistent JSON error responses for API routes.

Optional Logs collection model for persistent log storage.

Validation & Data Layer

Model-level validation and (where defined) MongoDB JSON-schema hints.

Centralized DB connection with Atlas support via MONGO_URI.

Client Application (Static)

HTML-based screens under client/components rendered via server routes.

Assets and styling under client/assets.

Pages include: login, profiles, feed, search, media details, player, add-media, and settings (edit profile, manage profiles, account, statistics).
