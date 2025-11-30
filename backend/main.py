import base64
import urllib.parse
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from config import MSG
from models import Lang, TextReq, TextResp, SessionInfo
from services import whisper, gemini, tts
from session import sessions
from assistant import assistant

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("starting viva...")
    whisper.init()
    gemini.init()
    print("viva ready")
    yield
    print("shutting down")

app = FastAPI(title="Viva", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID", "X-Transcribed-Text", "X-Response-Text", "X-Mode", "X-Language"],
)

def safe_hdr(text: str, maxlen: int = 0) -> str:
    if maxlen and len(text) > maxlen:
        text = text[:maxlen] + "..."
    return urllib.parse.quote(text, safe='')

@app.post("/process-voice", response_class=Response)
async def voice(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    language: str = Form("en")
):
    try:
        s = sessions.get_or_create(session_id, language)
        s.lang = Lang.AZ if language == "az" else Lang.EN
        
        data = await audio.read()
        text = await whisper.transcribe(data, s.lang.value)
        
        if not text:
            err = MSG[s.lang.value]["no_audio"]
            audio_resp = await tts.synth(err, s.lang.value, s.rate)
            return Response(
                content=audio_resp,
                media_type="audio/mpeg",
                headers={"X-Session-ID": s.sid, "X-Response-Text": safe_hdr(err), "X-Language": s.lang.value}
            )
        
        resp = await assistant.process(text, s)
        audio_resp = await tts.synth(resp, s.lang.value, s.rate)
        
        return Response(
            content=audio_resp,
            media_type="audio/mpeg",
            headers={
                "X-Session-ID": s.sid,
                "X-Transcribed-Text": safe_hdr(text),
                "X-Response-Text": safe_hdr(resp),
                "X-Mode": s.mode.value,
                "X-Language": s.lang.value
            }
        )
    except Exception as e:
        lang = language if language in ["en", "az"] else "en"
        try:
            audio_resp = await tts.synth(MSG[lang]["error"], lang, 1.0)
            return Response(content=audio_resp, media_type="audio/mpeg")
        except:
            raise HTTPException(500, str(e))

@app.post("/process-text", response_model=TextResp)
async def text(req: TextReq):
    lang = req.lang or "en"
    s = sessions.get_or_create(req.session_id, lang)
    s.lang = Lang.AZ if lang == "az" else Lang.EN
    
    resp = await assistant.process(req.text, s)
    intent, _, _ = await gemini.detect_intent(req.text, s.lang.value)
    
    audio_b64 = None
    if req.audio:
        data = await tts.synth(resp, s.lang.value, s.rate)
        audio_b64 = base64.b64encode(data).decode()
    
    return TextResp(text=resp, audio_b64=audio_b64, sid=s.sid, mode=s.mode.value, intent=intent.value, lang=s.lang.value)

@app.get("/session/{sid}", response_model=SessionInfo)
async def get_session(sid: str):
    s = sessions.get(sid)
    if not s:
        raise HTTPException(404, "session not found")
    
    return SessionInfo(
        sid=s.sid, mode=s.mode.value, topic=s.topic, topics=s.topics,
        quiz_score=s.quiz_st.score if s.quiz_st else 0,
        quiz_total=s.quiz_st.total if s.quiz_st else 0,
        conv_len=len(s.history), created=s.created.isoformat(),
        rate=s.rate, lang=s.lang.value
    )

@app.post("/session/reset", response_model=SessionInfo)
async def reset(session_id: Optional[str] = None, language: str = "en"):
    if session_id and session_id in sessions.data:
        del sessions.data[session_id]
    s = sessions.create(language)
    return SessionInfo(
        sid=s.sid, mode=s.mode.value, topic=s.topic, topics=s.topics,
        quiz_score=0, quiz_total=0, conv_len=0, created=s.created.isoformat(),
        rate=s.rate, lang=s.lang.value
    )

@app.post("/set-language")
async def set_lang(session_id: str, language: str):
    s = sessions.get(session_id)
    if not s:
        raise HTTPException(404, "session not found")
    s.lang = Lang.AZ if language == "az" else Lang.EN
    sessions.save(s)
    return {"message": MSG[s.lang.value]["lang_changed"], "language": s.lang.value}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "whisper": "ready" if whisper.model else "not loaded",
        "gemini": "configured",
        "tts": "edge-tts"
    }

@app.get("/test-audio", response_class=Response)
async def test_audio(language: str = "en"):
    txt = "Salam! Test mesajı." if language == "az" else "Hello! Test message."
    data = await tts.synth(txt, language, 1.0)
    return Response(content=data, media_type="audio/mpeg")

@app.get("/")
async def root():
    return {
        "name": "Viva",
        "version": "2.0.0",
        "endpoints": ["/process-voice", "/process-text", "/session/{sid}", "/health"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)