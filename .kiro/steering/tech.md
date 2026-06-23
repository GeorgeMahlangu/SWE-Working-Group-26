# Tech Stack

#[[file:../../docs/requirements.md]]

## Languages & Runtime

- **TypeScript** (strict mode enabled)
- **Node.js 20+** (pinned to v22 LTS via `.nvmrc`)
- **ES Modules** throughout

## Backend (server/)

- **Express** - Web framework
- **Prisma** - ORM for SQLite database (optional)
- **tsx** - TypeScript execution for development
- **Vitest** - Unit testing

## Frontend (client/)

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest + Testing Library** - Component testing
- **Playwright** - End-to-end testing

## Build & Quality Tools

- **npm workspaces** - Monorepo management
- **ESLint** - Linting (flat config with TypeScript and React plugins)
- **Prettier** - Code formatting
- **concurrently** - Running multiple dev servers

## Common Commands

All commands run from the repo root:

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies (both workspaces) |
| `npm run dev` | Start both backend and frontend with hot reload |
| `npm run build` | Build both apps for production |
| `npm start` | Run the production backend |
| `npm test` | Run all unit/component tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint all code |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |

### Workspace-specific commands

Append `--workspace=server` or `--workspace=client`:

```bash
npm run test:watch --workspace=client   # Watch mode testing
npm run test:coverage --workspace=server  # Coverage report
npm run preview --workspace=client      # Preview production build
```

### Database commands (server workspace)

```bash
npm run db:generate --workspace=server  # Generate Prisma client
npm run db:migrate --workspace=server   # Run migrations
npm run db:studio --workspace=server    # Open Prisma Studio
```

## Development URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API calls from frontend are proxied via `/api/*`
