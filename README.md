# Labour Code App - Compliance Auditor
Intelligent labor code auditing tool using Gemini Flash 2.5 and Supabase Vector.

## Security & Deployment
This project is configured securely for production hosting. 

### Frontend (Vercel)
The React + Vite frontend can be hosted directly on Vercel. 
You **must** configure the following Environment Variable in your Vercel deployment settings:
- `VITE_API_URL`: The URL of your deployed Python backend (e.g., `https://my-backend.onrender.com`). If not set, it defaults to `http://localhost:8000`.

*Note: The frontend does NOT need direct database keys. All Supabase requests are proxied securely through the backend.*

### Backend (Render / Railway / Vercel Serverless)
Host the FastAPI backend on a platform that supports Python.
You **must** configure the following Environment Variables in your backend server:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase **Service Role** Key
- `GEMINI_API_KEY`: Your Gemini API access key
