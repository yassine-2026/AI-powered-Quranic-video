# API Documentation

## `GET /api/surahs`
Returns a JSON array of all available Surahs.

## `GET /api/reciters`
Returns a JSON array of all available Reciters.

## `POST /api/generate`
Starts an asynchronous job to generate a Quranic video.

**Body:**
```json
{
  "surah": "1",
  "ayahs": "1-5",
  "reciter": "mishary",
  "style": "cinematic",
  "format": "16:9"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-v4",
  "message": "...",
  "estimatedTimeMs": 15000
}
```

## `GET /api/status/:jobId`
Returns the status of a specific job.

**Response:**
```json
{
  "jobId": "uuid-v4",
  "status": "completed",
  "videoUrl": "https://..."
}
```
