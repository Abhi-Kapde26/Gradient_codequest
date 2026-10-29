# ⚡ Gradient CodeQuest

**Gradient CodeQuest** is a game-based competitive programming tournament platform engineered with a hosted PostgreSQL database (Supabase free tier), Node.js + Express backend, and React + Vite frontend.

---

## 🛠 Technology Stack (100% ₹0 Cost)

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Game arena, live horizontal path, admin dashboard, leaderboard |
| **Backend** | Node.js + Express | Contest path rules, scoring, submissions, transactions |
| **Database** | Supabase PostgreSQL | Hosted relational tables, foreign keys, RLS security policies |
| **Deployment** | Vercel & Render | Free-tier cloud hosting for frontend & backend web services |

---

## 📐 Level Node Shapes

The contest path is shared across all teams in an event, while each team progresses along it independently:

| Type | Shape | Meaning |
| :--- | :--- | :--- |
| `START` | **Square** | Initial challenge milestone (Enforced strictly at position 1) |
| `QUEST` | **Circle** | Standard algorithmic or problem-solving checkpoint |
| `TREASURE_HUNT` | **Diamond** | Cryptographic cipher or logic puzzle checkpoint |
| `FINISH` | **Square (Dashed Gold)** | Final championship milestone (Enforced at final position) |

---

## 🗄️ Database Architecture (`database/schema.sql`)

The database uses PostgreSQL with Row Level Security (RLS) enabled on all tables:

1. **`users`**: Contestants and contest administrators.
2. **`events`**: Contest events and metadata.
3. **`event_admins`**: Admins with permission to author and evaluate.
4. **`game_nodes`**: Levels with unique positions, types, challenge statements, points, and expected answers.
5. **`teams`**: Participating squads with secret access codes and real-time scores.
6. **`players`**: Team roster members with explicit undergraduate representation (`UG1`, `UG2`, `UG3`, `UG4`).
7. **`team_progress`**: Current unlocked node and tournament completion records per team.
8. **`submissions`**: Contestant code/text answers awaiting admin evaluation (`PENDING`, `APPROVED`, `REJECTED`).
9. **`score_events`**: Immutable audit logs ensuring points are awarded strictly once per level.
10. **`node_hints`**: Tactical hints associated with challenging levels.
11. **`hint_unlocks`**: Tracks which teams have solved the separate debugging task to reveal the hint.

---

## 🚀 Quickstart Guide (Local Development)

### 1. Start the Backend API
```bash
npm run start:backend
# API starts at http://localhost:5000
```

### 2. Start the Frontend
In another terminal:
```bash
npm run start:frontend
# Vite dev server starts at http://localhost:5173
```

### 3. Run Automated Tests
```bash
npm test
```

---

## 🌐 Connecting Your Free Supabase PostgreSQL Database

1. Sign up for a free account at [Supabase](https://supabase.com).
2. Create a new project (e.g. `gradient-codequest`).
3. Open the **SQL Editor** in the Supabase Dashboard:
   - Copy and paste the contents of `database/schema.sql` and run it.
   - (Optional) Copy and paste `database/seed.sql` to populate sample contest levels and teams.
4. Go to **Project Settings** -> **API**:
   - Copy `Project URL` and `anon public key` (or `service_role secret`).
5. Open `backend/.env` and update:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ADMIN_API_KEY=admin-secret-codequest-2026
   ```
6. Restart the backend: `npm run start:backend`. The server will now communicate with hosted Supabase PostgreSQL!

---

## 🎮 Platform Features & Contest Flow

1. **Admin Console (`/admin`)**:
   - Create new tournaments with custom titles and rules.
   - Add, edit, and delete path nodes with real-time validation (ensuring exactly one `START` at position 1 and one `FINISH` at the end).
   - Register teams and allocate undergraduate members across `UG1` through `UG4`.
   - Real-time review deck for pending submissions with points preview and feedback.

2. **Team Quest Arena (`/game`)**:
   - Login using a team access code (e.g. `TEAM-ALPHA-101`).
   - View only currently unlocked levels—future levels remain securely locked.
   - Code & answer submission interface with pending review indicators.
   - **Tactical Hints with Debugging Tasks**: Hints require contestants to solve a distinct debugging task before unlocking.

3. **Championship Leaderboard (`/leaderboard`)**:
   - Connected horizontal path showing team density at each level.
   - Ranked team standings updated in real time with UG player badges, point counts, and completion badges.
