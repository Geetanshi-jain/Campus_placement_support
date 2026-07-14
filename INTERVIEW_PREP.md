# IIPS Campus Placement Hub — Interview Preparation Guide

This document is designed to help you explain this project effectively during technical interviews. It covers the "what", "why", and "how" of the project, focusing on the architecture, technical decisions, and the RAG pipeline.

---

## 1. The Elevator Pitch (What is this project?)
**"I built an AI-powered Campus Placement Knowledge Hub for my college (IIPS). It acts as a centralized platform where students can share and browse interview experiences. The core feature is a Retrieval-Augmented Generation (RAG) chatbot that allows students to ask questions about companies, interview rounds, and salaries, and receive accurate answers grounded strictly in historical college placement data."**

---

## 2. Key Features to Highlight
1. **RAG-Powered AI Chatbot:** Answers student queries using past interview data instead of generic internet knowledge.
2. **Web-Augmented HR Prep:** Uses Gemini with Google Search tool integration to generate real-time HR interview prep sheets (company background, current CEO, recent news).
3. **Data Ingestion & Vector Search:** Converts uploaded Excel sheets of placement data into semantic chunks, embeds them using Sentence Transformers, and stores them in FAISS for rapid similarity search.
4. **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for Students (browsing/chatting) vs. Admins (bulk data upload, analytics).

---

## 3. Tech Stack Explained
* **Frontend:** React.js (Vite), React Router, Context API, Vanilla CSS.
  * *Why?* Fast compilation with Vite, lightweight state management using Context API without the overhead of Redux.
* **Backend:** Django & Django REST Framework (DRF) using Function-Based Views (`@api_view`).
  * *Why?* Rapid API development, excellent built-in ORM, and seamless integration with Python-based AI/ML libraries.
* **Database:** SQLite (Relational data like Users, Companies) + FAISS (Vector database for AI search).
* **AI / ML:**
  * **LLM:** Google Gemini (`gemini-2.5-flash`).
  * **Embeddings:** `SentenceTransformers` (`all-MiniLM-L6-v2`) running locally on CPU.
  * *Why local embeddings?* Saves API costs and ensures data privacy while maintaining high-quality semantic matching.

---

## 4. Architecture & Data Flow (The Most Important Part)

If an interviewer asks, *"How does your chatbot work under the hood?"*, explain these two flows:

### A. The Data Ingestion Flow (When data is added)
1. **Upload:** Admin uploads an Excel sheet of past placements.
2. **Parsing:** Pandas reads the sheet and saves records to the SQLite database.
3. **Chunking:** The `ingestion.py` script breaks the massive text into smaller, meaningful chunks (e.g., 1 chunk for Summary, 1 chunk per Interview Round, 1 chunk for Tips).
4. **Context Preservation:** Every chunk is prefixed with metadata (`Company: TCS | Batch: 2025 | Verdict: Selected`) so it retains context when searched.
5. **Embedding & Storage:** The chunks are converted into 384-dimensional mathematical vectors using the local Sentence Transformer model and saved into the **FAISS** vector store.

### B. The RAG Retrieval Flow (When a student asks a question)
1. **Query:** Student asks, *"What DSA topics did Infosys ask?"*
2. **Vectorization:** The backend embeds this question into a vector using the exact same local embedding model.
3. **Similarity Search:** FAISS compares the question vector against all stored chunks using cosine similarity and retrieves the **top 10 most relevant chunks**.
4. **Prompt Construction:** The backend creates a prompt containing:
   * A strict system instruction (*"You are an IIPS advisor..."*)
   * The 10 retrieved chunks (labeled as sources).
   * The user's question and chat history.
5. **Generation:** The Gemini API reads this custom context and generates a precise answer, completely eliminating hallucinations.

---

## 5. Potential Interview Questions & How to Answer Them

**Q1: Why did you use FAISS instead of a standard SQL database for search?**
*Answer:* SQL relies on keyword matching (e.g., `LIKE '%array%'`). FAISS uses semantic vector matching. If a student searches for "data structures", FAISS understands that "graphs", "trees", and "arrays" are semantically related even if the exact keyword isn't in the text. It allows for "meaning-based" search.

**Q2: What happens if Gemini hallucinates (makes up an answer)?**
*Answer:* Because this is a strict RAG implementation, the System Prompt explicitly instructs Gemini to *only* use the provided context chunks. If the answer isn't in the chunks, it is instructed to say "I don't have enough information."

**Q3: Why did you chunk the data by interview rounds instead of just splitting it every 500 words?**
*Answer:* Standard character-based chunking can cut a sentence in half, destroying meaning. By chunking semantically (Round 1 chunk, Round 2 chunk, Tips chunk), I ensured that each piece of text fed to the LLM contains a complete, logical thought.

**Q4: How did you implement the Web Search for HR Prep?**
*Answer:* I used Gemini's native tool-calling features. I passed `tools=[{"google_search": {}}]` into the generation config. This allows the LLM to autonomously pause, query Google for live data (like the current CEO or recent news), and synthesize it into the final response.

---

## 6. Deep Architectural Questions (Advanced Interview Prep)

If the interviewer really wants to test your engineering depth, they will ask these system design questions:

**Q5: "Why did you choose Django over Express.js/Node.js for this specific project?"**
*Answer:* "Since the core of this project is AI/ML (RAG, FAISS, Sentence Transformers, Gemini API), using a Python-based backend was a natural choice. The Python ecosystem has native, first-class support for AI and data processing libraries (like Pandas and FAISS). Doing this in Node.js would have required clunky workarounds or microservices. Django also gave me a robust ORM and security features right out of the box."

**Q6: "How do you ensure the context passed to the LLM doesn't exceed its token limit?"**
*Answer:* "I implemented a `top_k=10` limit during the FAISS retrieval step. This means no matter how large the database grows, the system will only ever fetch the 10 most relevant semantic chunks. Since each chunk represents exactly one interview round or summary, this guarantees the prompt size remains tightly bounded and highly relevant, preventing token overflow."

**Q7: "Why did you separate the vector database (FAISS) from the relational database (SQLite)?"**
*Answer:* "Relational databases (SQLite) are optimized for structured queries (e.g., fetching a user by ID or filtering experiences by batch). Vector databases (FAISS) are optimized for mathematically calculating cosine similarity between high-dimensional arrays. By keeping them separate, I let SQLite handle business logic (authentication, CRUD operations) while FAISS acts exclusively as a high-speed, in-memory AI search index. They are linked via a `chunk_id` foreign key."

**Q8: "You mentioned running Embeddings locally. What is the architectural trade-off there?"**
*Answer:* "The trade-off is **Compute vs. Cost/Latency**. By running `SentenceTransformers` locally, I completely eliminate API costs and ensure student data isn't sent to a third party just for vectorization. However, the trade-off is higher CPU usage on my backend server. If the application scales to thousands of concurrent users, the local CPU might bottleneck, at which point I would switch to a dedicated API like VoyageAI (which my codebase already supports via a config toggle) or offload embedding to a GPU worker queue."

---

## 7. Future Scope (If they ask what you would add next)
* Move from SQLite to PostgreSQL + `pgvector` for scalable cloud deployment (consolidating the dual-database architecture).
* Add user authentication via Google OAuth (college email restriction).
* Introduce conversational memory (Redis) to remember user preferences across sessions.
