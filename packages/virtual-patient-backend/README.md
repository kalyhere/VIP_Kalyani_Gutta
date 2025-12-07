# Virtual Patient Backend

This is the backend service for the Virtual Patient application. It provides REST APIs, media handling, and integration with Google Cloud Storage.

## Folder Structure

```
services/         # Business logic and service classes
routes/           # Express route handlers
middleware/       # Express middleware (auth, error, rate limiting, etc.)
utils/            # Utility/helper functions
config/           # Configuration files and docs
 data/            # Sample cases and transcripts
 tests/           # (Recommended) Unit and integration tests
server.js         # App entry point
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in required values.
3. Start with Docker Compose (from monorepo root):
   ```bash
   npm run dev
   ```

## Development
- Use the provided folder structure for new code.
- Add tests in `tests/` for new features.
- Use ESLint and Prettier for code quality.

## Environment Variables
See root `.env.example` for required variables.

## Contributing
- Organize new code by feature/domain.
- Write clear, maintainable code and tests.
- Document new endpoints and features in this README. 