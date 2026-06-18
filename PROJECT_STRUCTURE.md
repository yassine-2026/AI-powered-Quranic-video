# Project Structure

- `/src/components`: React Native components (Theme toggle, Language toggle).
- `/src/data`: Local static JSON databases for Surahs and Reciters.
- `/src/i18n`: Internationalization settings.
- `/server.ts`: The Express API Backend Orchestrator handling incoming Web requests and executing calls to local AI tools.
- `/docker-compose.yml`: Local setup for the Express server and the open source AI LLMs and ComfyUI dependencies.
- `/vercel.json`: Deployment configs for Vercel.
