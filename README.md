# DOP-C02 Flashcards

Interactive flashcard app to study for the **AWS Certified DevOps Engineer – Professional (DOP-C02)** exam.

Built with React + Vite. No backend — all state is stored in `localStorage`.

## Features

- **75 flashcards** covering all DOP-C02 domains
- Filter by **Domain** and **Service category**
- **Random shuffle** on every session
- Mark cards as ★ to review later
- Track **✓ La sabía / ✗ No lo sabía** with a dedicated "Incorrectas" review mode
- Progress bar and stats (seen %, correct, incorrect)
- **Import your own JSON** — replace the deck at runtime without touching code
- Keyboard navigation: `←` `→` to navigate, `Space` to flip

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Importing custom flashcards

Click **⬆ Importar JSON** in the footer and select a `.json` file.

Accepted formats:

```json
[
  { "id": 1, "cat": "Lambda", "subdomain": "Domain 2: Configuration Management", "q": "Question?", "a": "Answer." },
  { "q": "Minimal — only q and a are required.", "a": "Answer." }
]
```

Top-level wrappers `{ "flashcards": [...] }` and `{ "cards": [...] }` are also accepted.

| Field       | Required | Description                          |
|-------------|----------|--------------------------------------|
| `q`         | ✅       | Question text                        |
| `a`         | ✅       | Answer text                          |
| `cat`       |          | Service/topic category               |
| `subdomain` |          | Exam domain (used for domain filter) |
| `id`        |          | Auto-assigned if omitted             |

## Project structure

```
├── dop_flashcards.jsx   # Main React component
├── flashcards.json      # Default deck (edit to add/remove cards)
├── src/
│   └── main.jsx         # React entry point
├── index.html
└── vite.config.js
```

## DOP-C02 domains covered

| Domain | Name |
|--------|------|
| 1 | SDLC Automation |
| 2 | Configuration Management and IaC |
| 3 | Resilient Cloud Solutions |
| 4 | Monitoring and Logging |
| 5 | Incident and Event Response |
| 6 | Security and Compliance |

## License

MIT
