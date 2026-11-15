# Backend

Local Express API. Copy `.env.example` to `.env`, set `MONGODB_URI`, then run:

```powershell
npm install
npm run dev
```

The API listens on port 5000 by default. Student endpoints return 503 until MongoDB connects; failed connections retry with capped backoff. Connection diagnostics redact the URI and credentials.
