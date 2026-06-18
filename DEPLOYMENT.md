# Deployment

## Docker (Recommended)
1. Install Docker and Docker Compose.
2. Build the services: `docker-compose build`
3. Run the complete stack: `docker-compose up -d`

## Vercel (Frontend only)
The AI GPU resources cannot run natively in Vercel's serverless environment.
1. Connect github repo to Vercel.
2. Set build command to `npm run build`.
3. Set output directory to `dist`.
4. Deploy the frontend on Vercel.
5. In your Vercel Environment variables, point your API calls to an external AI Server (e.g. EC2 / Lambda) running the backend logic and the AI tools.
