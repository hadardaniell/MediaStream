# 📘 MediaStream2 API – Endpoints Cheat Sheet

**Base URL:** `http://localhost:3000`  
All requests and responses use JSON.  
Authentication is via a **session cookie (`sid`)** — always send requests with `credentials: 'include'` from the frontend.

---

## 🔐 Auth Routes

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | Log in and start a session (sets `sid` cookie) |
| **GET** | `/api/auth/me` | Get the currently logged-in user |
| **POST** | `/api/auth/logout` | Log out (destroy session) |

---

## 🎬 Content Routes

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/content` | Get all content (supports filters & sort) |
|  | └ `?type=movie|series` – Filter by type |
|  | └ `?genre=Comedy` – Filter by genre |
|  | └ `?year=2020` – Filter by year |
|  | └ `?sort=year&order=asc|desc` – Sort results |
| **GET** | `/api/content/:id` | Get content by ID |
|  | └ `?include=episodes` – Include episodes (for series) |
|  | └ `?include=episodesCount` – Include season/episode counts |
| **POST** | `/api/content` | Create new content *(admin only)* |
| **PATCH** | `/api/content/:id` | Update content *(admin only)* |
| **DELETE** | `/api/content/:id` | Delete content *(admin only)* |

---

## 📺 Episodes Routes

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/content/:contentId/episodes` | List episodes for a given content |
|  | └ `?season=1` – Filter by season number |
| **POST** | `/api/content/:contentId/episodes` | Create a single episode *(admin only)* |
| **POST** | `/api/content/:contentId/episodes/bulk` | Create multiple episodes at once *(admin only)* |
| **PATCH** | `/api/episodes/:id` | Update an episode *(admin only)* |
| **DELETE** | `/api/episodes/:id` | Delete an episode *(admin only)* |

---

## 👤 Users Routes *(if implemented)*

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/users` | Get all users *(admin only)* |
| **GET** | `/api/users/:id` | Get a user by ID *(self or admin)* |
| **PATCH** | `/api/users/:id` | Update a user *(self or admin)* |
| **DELETE** | `/api/users/:id` | Delete a user *(admin only)* |

---

## ⚙️ Notes

- **Admin access** is required for all create/update/delete routes.  
- **Error format:**  
  ```json
  { "error": "Message here" }
