# Collaborative Markdown Editor

A lightweight, real-time collaborative Markdown editor built with React and TypeScript. It provides simultaneous editing powered by Yjs, live cursor awareness, role-based access control, and a Markdown preview.

**Highlights**
- Real-time editing with CRDTs (Yjs + WebSocket)
- Live remote cursors and presence
- Monaco-based editor with Markdown preview
- Role-based sharing (Owner / Editor / Viewer)

## Tech Stack

- React 18 + TypeScript
- Monaco Editor, Yjs, y-websocket
- react-markdown for rendering
- Tailwind CSS + PostCSS for styles
- Vite for development and build

## Project Structure

```
src/
├── pages/         # Page components (Auth, Documents, EditDocument, Landing)
├── components/    # Reusable UI components
├── services/      # API and collaboration services
├── contexts/      # React contexts (AuthContext, NotificationContext)
├── config/        # Theme and env helpers
├── styles/        # Global CSS and markdown styles
└── types/         # Type declarations
```

## Quick Start

Prereqs: Node.js >=16 and pnpm (or npm/yarn)

1. Install dependencies

```bash
pnpm install
```

2. Create a `.env` file at project root with these variables (example):

```env
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=ws://localhost:8000
VITE_PORT=5173
```

3. Run the dev server

```bash
pnpm run dev
```

4. Build for production

```bash
pnpm run build
pnpm run preview
```

## Configuration & Environment

- `VITE_API_URL`: Backend REST API base URL
- `VITE_WEBSOCKET_URL`: WebSocket (y-websocket) server URL for Yjs sync
- `VITE_PORT`: Local dev server port (optional)

## Key Services

- **CollaborationProvider** — Manages Yjs documents, websocket connection, and awareness (presence/cursors).
- **ApiService** — Handles authentication, document CRUD and sharing endpoints.
- **AuthContext** — Stores auth state and exposes login/logout helpers.

## Collaboration Features

- Real-time CRDT syncing via Yjs and `y-websocket` for automatic conflict resolution.
- Live cursor and presence indicators using Yjs awareness protocol.
- Role-based access control: Owner, Editor, Viewer. Owners manage collaborators and permissions.

## Development Tips

- To inspect real-time updates, open the same document in multiple browser windows.
- Cursor colors are deterministic based on user ID hash.

## Contributing

Contributions are welcome. Please open issues or PRs for bugs and enhancements.

1. Fork the repo
2. Create a feature branch
3. Run `pnpm install` and `pnpm run dev` locally
4. Add tests where applicable and ensure linting passes

