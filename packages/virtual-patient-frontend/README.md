# Virtual Patient Frontend

This is the frontend for the Virtual Patient application, built with React and Vite. It provides the user interface for interacting with virtual patients and medical scenarios.

## Folder Structure

```
src/
  components/      # Reusable UI components
  hooks/           # (Recommended) Custom React hooks
  utils/           # Utility/helper functions
  assets/          # Static assets (images, icons, etc.)
  tests/           # (Recommended) Unit and integration tests
  App.jsx          # Main app component
  main.jsx         # Entry point
public/            # Static files (images, media, favicon, etc.)
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in required values.
3. Start the app (from monorepo root):
   ```bash
   npm run vp:frontend
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
- Document new features in this README. 

Line to trigger deploy