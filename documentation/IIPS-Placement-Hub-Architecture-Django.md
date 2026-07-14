# IIPS Campus Placement Knowledge Hub — Architecture (Django + FAISS)

## 1. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                        │
│   Landing → Admin Login | Student Login | Start Talking (Chat)   │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ REST/JSON (HTTPS)
┌───────────────────────────────▼───────────────────────────────────┐
│                    BACKEND (Django + Django REST Framework)        │
│   apps/authentication  — Django built-in auth (role: student/admin)│
│   apps/admin_panel     — upload, CRUD, stats                       │
│   apps/experiences     — structured records, filter/browse         │
│   apps/chat            — RAG logic (ingestion + retrieval)         │
│   apps/resume          — resume-fit scoring                        │
└───────┬─────────────────────┬───────────────────┬─────────────────┘
        │                     │                   │
┌───────▼───────┐   ┌─────────▼─────────┐  ┌──────▼───────────────┐
│  Postgres      │   │  FAISS index       │  │  LLM Layer (Claude)  │
│  — structured  │   │  (vector_store/)   │  │  api.anthropic.com   │
│  experiences,  │   │  local .index file │  │  + web_search tool   │
│  users, chunks │   │  + id→metadata map │  │  for HR-brief route  │
│  metadata      │   │                     │  │                      │
└────────────────┘   └──────────┬──────────┘  └──────────────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │  Embedding service     │
                     │  (Voyage AI API, or    │
                     │  local sentence-       │
                     │  transformers)         │
                     └────────────────────────┘

        ┌─────────────────────────────┐
        │  storage/uploads/  (local)   │  ← raw Excel uploads, kept for audit
        └─────────────────────────────┘
```

**Why this split:** Postgres holds the structured record (company, batch, verdict, rounds) so filters and admin edits stay simple and reliable. FAISS holds a *semantic index* of the free-text fields (summaries, round topics, tips) so the chatbot can answer fuzzy questions ("companies that asked DBMS heavy questions") that a plain SQL filter can't. FAISS itself only stores vectors — actual metadata (which chunk, which submission) lives in Postgres and is joined back after a similarity search.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Matches the prototype already built |
| Backend | Django + Django REST Framework | Batteries-included: auth, admin panel, ORM all built in — less to wire up yourself |
| Primary DB | PostgreSQL | Structured, filterable placement records |
| Vector index | FAISS (local, file-based) | No external vector DB service needed; index file lives in `vector_store/` |
| Embeddings | Voyage AI API (or local `sentence-transformers` model if you want no external embedding calls) | Voyage integrates cleanly with Claude workflows |
| LLM | Claude API (`claude-sonnet-4-6`) | Chat answers, HR-brief generation, resume-fit reasoning |
| Auth | Django's built-in `auth` app (sessions or DRF `SimpleJWT` for the React frontend) | No need to hand-roll JWT/bcrypt logic |
| File parsing | `openpyxl` / `pandas` | Standard Excel parsing in Python |
| File storage | `storage/uploads/` (local disk) | No S3 needed for a college project |
| Hosting | Frontend: Vercel/Netlify · Backend: Railway/Render (Docker) | Free-tier friendly |

---

## 3. Project structure

```
project-root/
├── frontend/                      # React
│   ├── src/
│   │   ├── pages/                 # Landing, AdminLogin, StudentLogin, Chat
│   │   ├── components/
│   │   └── api/                   # axios/fetch wrappers to Django endpoints
│   └── package.json
│
├── backend/                       # Django (single service)
│   ├── config/                    # settings.py, urls.py, wsgi/asgi
│   ├── apps/
│   │   ├── authentication/
│   │   │   ├── models.py          # Profile model (role: student/admin)
│   │   │   ├── serializers.py
│   │   │   ├── views.py           # register/login/me
│   │   │   └── urls.py
│   │   ├── admin_panel/
│   │   │   ├── views.py           # upload-sheet, stats
│   │   │   └── urls.py
│   │   ├── experiences/
│   │   │   ├── models.py          # Experience model
│   │   │   ├── serializers.py
│   │   │   ├── views.py           # CRUD, filter/browse
│   │   │   └── urls.py
│   │   ├── chat/                  # RAG logic yahin — no separate microservice
│   │   │   ├── models.py          # ExperienceChunk (FK to Experience)
│   │   │   ├── ingestion.py        # chunk + embed on upload/submit
│   │   │   ├── retrieval.py        # embed query, FAISS search, join metadata
│   │   │   ├── views.py           # /chat/ask, /chat/hr-brief
│   │   │   └── urls.py
│   │   └── resume/
│   │       ├── views.py           # /resume/match
│   │       └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── vector_store/                  # FAISS index files + build script
│   ├── experiences.index          # FAISS binary index
│   ├── id_map.json                # FAISS internal id → submission_id/chunk_id
│   └── build_index.py             # rebuild-from-scratch script
│
├── storage/uploads/                # local file storage (raw Excel uploads)
├── docker-compose.yml              # postgres + backend + frontend
└── README.md
```

---

## 4. Data model (Django models, core fields)

**`experiences.Experience`**
```python
submission_id, company, author, batch, date_submitted, verdict,
overall_process_summary, round_1_name, round_1_topics, ... round_5_topics,
additional_rounds, tips_advice, source_type, created_by (FK → User)
```

**`chat.ExperienceChunk`** — the RAG layer, derived from `Experience`
```python
chunk_id, experience (FK → Experience), chunk_text,
chunk_type (summary | round | tips), faiss_id (int, maps to FAISS index position),
company, batch, verdict   ← denormalized for filtered search
```

**`authentication.Profile`**
```python
user (OneToOne → Django User), role (student | admin), batch
```

**`experiences.Company`** (optional, denormalized for fast stats)
```python
company_id, name, visits_count, selected_count, last_visited_month
```

---

## 5. Backend routes (DRF)

### Auth
```
POST   /api/auth/student/register/
POST   /api/auth/student/login/
POST   /api/auth/admin/login/
GET    /api/auth/me/
```

### Admin
```
POST   /api/admin/upload-sheet/       → parse Excel, upsert into experiences + trigger chunk+embed
GET    /api/admin/experiences/        → paginated table view for the cell
PUT    /api/admin/experiences/:id/
DELETE /api/admin/experiences/:id/
GET    /api/admin/stats/              → company-wise visits, selection %, monthly trend
```

### Experiences (student-facing, structured)
```
POST   /api/experiences/              → student submits new experience (triggers chunk+embed)
GET    /api/experiences/              → filter by company / batch / verdict / month
GET    /api/experiences/:id/
GET    /api/companies/                → distinct companies + quick summary counts
```

### Chat — RAG lives in `apps/chat`
```
POST   /api/chat/ask/                 → RAG pipeline (see §6), grounded in your own data
POST   /api/chat/hr-brief/            → company name → Claude + web_search tool (external, not FAISS)
```

### Resume
```
POST   /api/resume/match/             → FAISS retrieval of a company's chunks + similarity scoring vs resume text
```

---

## 6. Where RAG fits, step by step

**Ingestion (`chat/ingestion.py`, runs on every upload / submission):**
1. Admin uploads Excel *or* student submits the form → row saved to `Experience`.
2. `chunk_experience()` splits free-text fields into chunks: one per round, one for `overall_process_summary`, one for `tips_advice`.
3. Each chunk sent to the embedding API (Voyage AI, or local model) → vector returned.
4. Vector appended to the FAISS index (`faiss_index.add()`); the returned FAISS internal id is stored on the `ExperienceChunk` row alongside metadata (`company`, `batch`, `verdict`).
5. Index re-saved to disk (`faiss.write_index`) so it survives restarts.

**Query — `/api/chat/ask/` (used by both "Start Talking" and "Ask Anything"):**
1. User's question embedded the same way.
2. `faiss_index.search()` returns top-k nearest vector ids (optionally pre-filtered by company/batch by querying `ExperienceChunk` metadata first, then restricting search).
3. Backend joins returned FAISS ids → `ExperienceChunk` rows → `Experience` records in Postgres.
4. Prompt built: system instructions + retrieved chunks (with `submission_id` so the answer can cite "based on Rahul's 2025 experience") + user's question + chat history.
5. Prompt sent to Claude API → answer returned, grounded only in retrieved chunks.
6. Response (+ source `submission_id`s) sent back to frontend.

**`/api/chat/hr-brief/` is *not* RAG** — it skips FAISS entirely and asks Claude (with the `web_search` tool) to look up current CEO/CTO/tech-stack info from the open web.

**`/api/resume/match/`** is a lighter RAG use: retrieve a company's chunks via FAISS, then compare resume text against them (cosine similarity on embeddings) to score fit and surface gaps.

---

## 7. FAISS-specific implementation notes

FAISS is a library, not a server — you own persistence and loading:
- One index file per collection (e.g. `vector_store/experiences.index`), plus `id_map.json` or a Postgres table mapping FAISS's internal integer ids → your `chunk_id`/`submission_id`, since FAISS doesn't store metadata itself.
- Load the index into memory **once** at Django startup (in `apps/chat/apps.py`'s `ready()` hook) rather than reading from disk per-request.
- On ingestion: add vector → re-save index to disk. On deletion/edit: FAISS doesn't support in-place deletes cleanly for `IndexFlatL2`/`IndexFlatIP` — easiest approach for a student-project scale is to rebuild the index periodically via `vector_store/build_index.py`, or mark chunks as `deleted` in Postgres and filter them out post-search.
- `IndexFlatL2` or `IndexFlatIP` (brute-force) is plenty at your data scale — no need for `IVF`/`HNSW` variants.

---

## 8. Feature list mapped to routes

| Feature | Route(s) | RAG involved? |
|---|---|---|
| Admin bulk upload | `POST /api/admin/upload-sheet/` | No (triggers ingestion) |
| Admin edit/delete records | `/api/admin/experiences/:id/` | No |
| Admin dashboard (stats, trends) | `GET /api/admin/stats/` | No |
| Student: share interview experience | `POST /api/experiences/` | No (triggers ingestion) |
| Student: browse/filter by company, batch, verdict | `GET /api/experiences/` | No |
| Student: "Ask Anything" chatbot | `POST /api/chat/ask/` | **Yes — core RAG (FAISS)** |
| Student: "Start Talking" (landing chat) | `POST /api/chat/ask/` | **Yes — same pipeline** |
| Student: "Must Know for HR" | `POST /api/chat/hr-brief/` | No (web-search augmented, not RAG) |
| Student: resume fit check | `POST /api/resume/match/` | Yes — FAISS retrieval + similarity |
| Auth (student/admin) | `/api/auth/*` | No (Django built-in auth) |

---

## 9. Build order (MVP → full)

1. **Phase 1 – structured core:** Django auth (built-in), admin upload, experiences CRUD, student submit + filter/browse — no FAISS yet, everything on plain Postgres queries.
2. **Phase 2 – chatbot without RAG:** wire `/api/chat/ask/` to stuff *all* records into the prompt (fine while data is small, matches current prototype behavior).
3. **Phase 3 – add RAG:** once records grow past what fits in a prompt, add `ExperienceChunk` model + embeddings + FAISS index so the chatbot scales and cites specific submissions instead of skimming everything.
4. **Phase 4 – HR-brief: ** add the web-search-augmented route and the FAISS-based resume checker.

This lets you ship something working fast and only add the FAISS/RAG layer once "paste everything in the prompt" stops being good enough.
