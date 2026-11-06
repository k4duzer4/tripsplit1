const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

# AGENTS.md

## Project Context

Trip Split is a React/Vite application with a local Node.js API. Treat it as user-owned code, keep changes focused on the request, and preserve existing conventions.

Start with `README.md` for local setup, environment variables, and the available scripts.

## Key Files

- `src/`: frontend application source.
- `src/api/apiClient.js`: frontend client for the local API.
- `server/index.js`: local API and file-backed persistence.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Run `npm run server` for the API and `npm run dev` for the frontend.
- The Vite development server forwards `/api` requests to `http://localhost:3001`.
- Reuse the existing API client and React patterns before introducing a new integration path.
- Run the relevant checks from `package.json` before finishing code changes.
