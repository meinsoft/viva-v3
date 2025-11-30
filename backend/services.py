import os
import re
import json
import asyncio
import tempfile
import edge_tts
import google.generativeai as genai
from faster_whisper import WhisperModel

from config import GEMINI_KEY, VOICES
from models import Intent
from prompts import INTENT_PROMPT

class Whisper:
    def __init__(self):
        self.model = None

    def init(self):
        if not self.model:
            print("[whisper] loading...")
            self.model = WhisperModel("turbo", device="cpu", compute_type="int8", num_workers=4)
            print("[whisper] ready")

    def _transcribe(self, path, lang):
        segs, _ = self.model.transcribe(
            path, beam_size=1, best_of=1, vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            language=lang, condition_on_previous_text=False,
            no_speech_threshold=0.6
        )
        return " ".join(s.text for s in segs).strip()

    async def transcribe(self, audio: bytes, lang: str = "en") -> str:
        if not self.model:
            self.init()
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio)
            path = f.name
        
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._transcribe, path, lang)
        finally:
            if os.path.exists(path):
                os.unlink(path)

class Gemini:
    def __init__(self):
        self.model = None

    def init(self):
        if not self.model:
            genai.configure(api_key=GEMINI_KEY)
            self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def gen(self, prompt: str) -> str:
        if not self.model:
            self.init()
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
        return resp.text

    async def detect_intent(self, text: str, lang: str = "en") -> tuple[Intent, str | None, float]:
        prompt = INTENT_PROMPT[lang].format(user_input=text)
        try:
            resp = await self.gen(prompt)
            cleaned = resp.strip()
            for pfx in ["```json", "```", "json"]:
                cleaned = cleaned.removeprefix(pfx)
            cleaned = cleaned.removesuffix("```").strip()
            
            data = json.loads(cleaned)
            intent_str = data.get("intent", "unknown")
            topic = data.get("topic")
            conf = data.get("confidence", 0.5)
            
            mapping = {
                "learn": Intent.LEARN, "quiz": Intent.QUIZ, "question": Intent.QUESTION,
                "repeat": Intent.REPEAT, "back": Intent.BACK, "stop": Intent.STOP,
                "slower": Intent.SLOWER, "faster": Intent.FASTER, "example": Intent.EXAMPLE,
                "simplify": Intent.SIMPLIFY, "continue": Intent.CONTINUE
            }
            return mapping.get(intent_str, Intent.UNKNOWN), topic, conf
        except:
            return Intent.UNKNOWN, None, 0.0

class TTS:
    @staticmethod
    def clean(text: str) -> str:
        text = re.sub(r'```[\s\S]*?```', '', text)
        text = re.sub(r'`([^`]+)`', r'\1', text)
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'\1', text)
        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*[\*\-\+]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    async def synth(self, text: str, lang: str = "en", rate: float = 1.0) -> bytes:
        text = self.clean(text)
        voice = VOICES.get(lang, VOICES["en"])
        rate_str = f"+{int((rate-1)*100)}%" if rate >= 1 else f"{int((rate-1)*100)}%"
        
        comm = edge_tts.Communicate(text, voice, rate=rate_str)
        audio = b""
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
        return audio

whisper = Whisper()
gemini = Gemini()
tts = TTS()