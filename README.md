# Viva

Voice-based learning assistant. Speak to learn, get quizzed, ask questions.

## Stack

- **Backend**: FastAPI, Whisper, Gemini, Edge-TTS
- **Frontend**: React, Vite

## Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/process-voice` | POST | Audio in, audio out |
| `/process-text` | POST | Text in, text/audio out |
| `/session/{id}` | GET | Session state |
| `/health` | GET | Status check |

## Commands

- "Teach me about [topic]" - start learning
- "Quiz me" - test knowledge
- "Repeat" / "Back" / "Continue"
- "Simplify" / "Give example"
- "Slower" / "Faster"
- "Stop"

## Languages

English, Azerbaijani
