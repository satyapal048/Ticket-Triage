# 🎫 AI Ticket Triage

A complete full-stack application that automatically categorizes and prioritizes user support tickets using local NLP heuristic logic, without relying on external LLM APIs.

## Setup & Running

**Prerequisites:** Docker and Docker Compose must be installed on your machine.

1. Clone or download the repository.
2. Open a terminal in the project root containing `docker-compose.yml`.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

No extra database setup is required; the SQLite DB will be automatically created in the `./data` folder when the backend starts.

### Running Natively Without Docker

If Docker is unavailable, you can run the services manually (requires Node.js):

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   npm install
   npm run start
   ```
2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will typically run at http://localhost:5173*.


## Architecture

```text
  [User Browser]
       │
     (HTTP)
       ▼
 ┌─────────────┐       ┌────────────────┐
 │   Frontend  │ ────► │  Backend API   │
 │ React+Vite  │       │ Express.js     │
 └─────────────┘       └───────┬────────┘
                               │
                          (Orchestrates)
                               ▼
        ┌──────────────────────────────────────────┐
        │               Services                   │
        │ ┌──────────────┐      ┌────────────────┐ │
        │ │ TicketService│◄────►│ Analyzer/NLP   │ │
        │ └───────┬──────┘      │ Heuristics     │ │
        │         │             └────────────────┘ │
        └─────────┼────────────────────────────────┘
                  │
              (Persists)
                  ▼
          ┌──────────────┐
          │   SQLite     │
          │ (better-sql) │
          └──────────────┘
```

**Separation of Concerns:**
- **Controller Layer (`ticketController.js`):** Handles HTTP request/response validation mapping.
- **Service Layer (`ticketService.js`):** Orchestrates the logic flow—running the analyzer and persisting to the database.
- **Analyzer Layer (`ticketAnalyzer.js`):** Contains the core heuristic and classification logic, entirely pure and functional.

## API Reference

### 1. Submit a Ticket for Analysis
**POST `http://localhost:3001/tickets/analyze`**

**Request:**
```json
{
  "message": "My payment was charged twice and I need a refund urgently"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "message": "My payment was charged twice and I need a refund urgently",
  "category": "Billing",
  "priority": "P1",
  "urgency": true,
  "confidence": 0.8,
  "keywords": ["payment", "refund", "charge", "urgent"],
  "signals": [
    "Matched 3 keywords for category Billing",
    "Urgency detected based on user terminology"
  ],
  "createdAt": "2024-03-01T12:00:00.000Z"
}
```

### 2. Get Recent Tickets
**GET `http://localhost:3001/tickets`**

**Response (200 OK):**
```json
{
  "tickets": [
    {
      "id": 1,
      "message": "...",
      "category": "Billing",
      ...
    }
  ]
}
```

## Design Decisions

- **Why SQLite:** It's zero-config, file-based, and perfect for local/demo apps. It avoids the overhead of managing a separate database container like PostgreSQL while remaining fast for synchronous I/O.
- **Why keyword config is separate (`keywords.js`):** It separates the "rules" from the pure JavaScript logic, meaning support managers could tweak or extend the vocabulary array without ever needing to modify the deeper analysis algorithms.
- **Why Express over Fastify:** Simplicity, extensive community familiarity, and sufficient performance for standard local triage tools.
- **Confidence scoring rationale:** Pure NLP heuristics won't be 100% accurate. The confidence score formulation `min(1.0, matchedKeywords / totalKeywordsForDetectedCategory)` strictly enforces mathematical normalization out of `100%`, providing an easy trust-signal for human reviewers.
- **Structured Signals:** Instead of string arrays, the backend emits structured object arrays (`{ type, message }`). This improves extensibility, as downstream components (like React UI) can safely format UI styles based on enumerated types instead of brittle string-matching (e.g. searching for the word "Security").
- **Database Index Optimization:** An explicit `createdAt DESC` index was added to the SQLite database. Since the core `GET /tickets` query primarily orders entries by the time they were created descending, indexing saves full-table scans at scale.

## Custom Rule: Security Escalation

This application implements a critical Security Escalation Rule.

- **What it does:** If the message contains any security-related term (e.g. `hack`, `breach`, `phishing`), the system immediately overrides all logic to mark it as **P0 Priority**, flags it as truly urgent, and injects a "⚠️ Security escalation" signal.
- **Why it matters:** Security incidents carry immense legal, financial, and compliance risks. A user locked out due to fraud must never fall through the cracks of a "P2" or lower queue just because they used brief phrasing.
- **How to test it:** Submit the message: `"I think my account was hacked"`. Watch the dashboard turn red and immediately surface the P0 security signal.

## Reflection

**Trade-offs: Keyword Matching vs. Real NLP**
The chosen heuristic keyword matching is incredibly fast, transparent, and easy to configure. However, it lacks context. For instance, "I *wish* this app didn't *crash*" contains both a feature term ("wish") and technical term ("crash"). A real NLP model (like BERT or TF-IDF) would understand the semantic intent better than pure substring matches.

**Limitations:**
- No context awareness or understanding of negation ("It is *not* broken", yet might match "broken").
- Zero typo tolerance (if the user types "ubg" instead of "bug", it fails).
- Hardcoded for English-only.

**What I'd Improve:**
- Integrate a lightweight, local intent-classifier ML model (like word2vec or local fastText).
- Add typo-tolerance via Levenshtein distance matching.
- Support a WebSocket or SSE connection so the history table updates in real-time across multiple admin browsers.
- Add multilingual support, perhaps chaining translating APIs before running the English heuristic.

## Test Results

Unit tests were written with Jest to test all heuristics thoroughly.

```text
 PASS  tests/analyzer.test.js
  ticketAnalyzer - classify() and analyzeTicket()
    ✓ "My invoice shows wrong charge" → category: Billing
    ✓ "App keeps crashing on login" → category: Technical
    ✓ "Please add dark mode" → category: Feature Request
    ✓ "I got hacked" → category: Technical, priority: P0 (security rule)
    ✓ "Random message xyz" → category: Other
    ✓ Empty string → throws validation error

 PASS  tests/priority.test.js
  ticketAnalyzer - priority logic
    ✓ Security term present → P0
    ✓ Urgency keyword + no security → P1
    ✓ Feature request category → max P2
    ✓ No signals → P3
    ✓ "outage" keyword → P0
```
