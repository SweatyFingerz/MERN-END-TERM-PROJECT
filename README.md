# DoubtHub

A Q&A platform for students, built with the MERN stack. Ask a doubt, get answers from classmates, vote on the best ones, and mark the one that solved it. Helpful answers earn reputation.

**Live demo:** https://mern-end-term-project-dusky.vercel.app
**API health check:** https://mern-end-term-project-8h1c.onrender.com/api/health
**Demo video:** coming soon

> The backend runs on a free tier. If the first load is slow, wait about 60 seconds for the server to wake up, then refresh.

**Demo accounts:** `asha@demo.com` / `demo123` or `meera@demo.com` / `demo123`

## Features
- Sign up and log in with JWT authentication (passwords hashed with bcrypt)
- Ask, edit and delete doubts (author only), with up to 5 tags
- Search, filter by tag, "Unanswered" view, pagination
- Post and delete answers
- Upvote or downvote answers (one vote per user, click again to undo, no voting on your own answer)
- Asker marks one answer as the solution (highlighted and pinned to the top)
- Reputation system: +5/-5 per vote on an answer, +15 for an accepted answer
- Profile page with reputation, doubts asked and doubts answered
- Loading, empty and error states, responsive layout

## Tech stack
| Layer | Choice |
|---|---|
| Frontend | React 18, React Router 6, Vite |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose (answers embedded in the question document) |
| Auth | JWT (7 days), bcryptjs |
| Hosting | Vercel (client), Render (server), MongoDB Atlas (database) |

## Engineering decisions
- **Embedded answers.** Answers and votes live inside the question document, so the detail page needs one query and an answer's vote can be updated atomically with the question.
- **Server-enforced rules.** Ownership, one-vote-per-user and asker-only accept are checked on the server, not just hidden in the UI.
- **Single response shape.** Every mutation returns the full updated question (scores and the viewer's own vote already computed), so the client never has to merge state.
- **Centralised async error handling** and consistent `{ message }` error responses.
- Search input is regex-escaped to avoid ReDoS/injection.

## Run locally
Requires Node 18+ and a MongoDB Atlas (or local) database.

```bash
# 1. API
cd server
cp .env.example .env        # fill in MONGO_URI and a long random JWT_SECRET
npm install
npm run seed                # optional demo data (asha@demo.com / demo123)
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Environment variables
| File | Variable | Purpose |
|---|---|---|
| server/.env | `MONGO_URI` | MongoDB connection string |
| server/.env | `JWT_SECRET` | Secret used to sign tokens |
| server/.env | `CLIENT_URL` | Allowed CORS origin (your frontend URL) |
| server/.env | `PORT` | Optional, defaults to 5000 |
| client/.env | `VITE_API_URL` | API base URL, e.g. `https://doubthub-api.onrender.com/api` |

`.env` files are git-ignored. Only the `.env.example` templates are committed.

## API
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | - | Create account |
| POST | /api/auth/login | - | Log in |
| GET | /api/auth/me | yes | Current user |
| GET | /api/auth/users/:id | - | Public profile |
| GET | /api/questions?q=&tag=&sort=&page= | - | List, search, filter |
| GET | /api/questions/tags/popular | - | Top tags |
| GET | /api/questions/:id | - | Question with answers |
| POST | /api/questions | yes | Ask a doubt |
| PUT / DELETE | /api/questions/:id | owner | Edit / delete |
| POST | /api/questions/:id/answers | yes | Add answer |
| DELETE | /api/questions/:id/answers/:aid | owner | Delete answer |
| POST | /api/questions/:id/answers/:aid/vote | yes | Body `{ "value": 1 or -1 }` |
| POST | /api/questions/:id/answers/:aid/accept | asker | Toggle solution |

## Deployment
1. **Database:** create a free MongoDB Atlas cluster, add a database user, and allow network access (0.0.0.0/0 for the demo).
2. **API on Render:** New Web Service, root directory `server`, build `npm install`, start `npm start`. Add `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL` as environment variables.
3. **Client on Vercel:** import the repo, root directory `client`, framework Vite, and add `VITE_API_URL` pointing at the Render URL plus `/api`. Then set `CLIENT_URL` on Render to the Vercel URL.

## Known limitations / future work
- Plain-text answers (no markdown or code highlighting)
- No rate limiting or email verification
- Reputation is stored, not recomputed from history

## Demo video outline (about 3 minutes)
Sign up, ask a doubt with tags, search and filter, log in as a second user, answer, vote, switch back and mark the solution, show the reputation change on the profile.
