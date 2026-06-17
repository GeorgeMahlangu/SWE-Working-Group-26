# Node Conf Starter

A full-stack Node.js + React starter template with modern tooling and best practices.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest
- **API**: RESTful with error handling middleware

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **E2E Testing**: Playwright
- **Package Manager**: npm workspaces

## Project Structure

```
node-conf-starter/
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Custom middleware
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── tests/             # Vitest tests
│   └── package.json
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── main.tsx       # Entry point
│   │   ├── App.tsx        # Main component
│   │   └── index.css      # Tailwind imports
│   ├── tests/             # Playwright tests
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── package.json           # Root monorepo config
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/thandog/node-conf-starter.git
cd node-conf-starter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Initialize the database:
```bash
npm run db:migrate --workspace=server
```

### Development

Start both backend and frontend servers in development mode:

```bash
npm run dev
```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:5173`.

### Building

Build both applications for production:

```bash
npm run build
```

### Testing

Run all tests (unit tests for backend, unit and E2E for frontend):

```bash
npm run test
npm run test:e2e
```

## Backend Scripts

```bash
npm run dev --workspace=server      # Start dev server
npm run build --workspace=server    # Build for production
npm run test --workspace=server     # Run Vitest unit tests
npm run db:migrate --workspace=server # Run Prisma migrations
```

## Frontend Scripts

```bash
npm run dev --workspace=client      # Start Vite dev server
npm run build --workspace=client    # Build for production
npm run test --workspace=client     # Run Vitest unit tests
npm run test:e2e --workspace=client # Run Playwright E2E tests
npm run preview --workspace=client  # Preview production build
```

## Database

The project uses SQLite with Prisma ORM. Database file is stored at `server/dev.db`.

### Creating Migrations

```bash
npm run db:migrate:dev --workspace=server
```

### Prisma Studio

View and edit your database:

```bash
npm run db:studio --workspace=server
```

## API Example

The backend includes a sample API endpoint at `/api/health` that returns the server status.

## Styling

Tailwind CSS is pre-configured in the frontend. Add utility classes directly to your JSX:

```jsx
<div className="flex items-center justify-center min-h-screen bg-gray-100">
  <h1 className="text-4xl font-bold text-blue-600">Welcome!</h1>
</div>
```

## Testing

### Backend (Vitest)
Unit tests for server logic in `server/tests/`

### Frontend (Vitest + Playwright)
- Unit tests in `client/tests/`
- E2E tests in `client/e2e/`

## Docker

Build and run with Docker:

```bash
docker-compose up
```

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
