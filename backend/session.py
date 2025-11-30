import uuid
from typing import Optional
from models import Session, ConvMsg, Lang

class Sessions:
    def __init__(self):
        self.data: dict[str, Session] = {}

    def create(self, lang: str = "en") -> Session:
        sid = str(uuid.uuid4())
        s = Session(sid=sid, lang=Lang.AZ if lang == "az" else Lang.EN)
        self.data[sid] = s
        return s

    def get(self, sid: str) -> Optional[Session]:
        return self.data.get(sid)

    def get_or_create(self, sid: Optional[str], lang: str = "en") -> Session:
        if sid and sid in self.data:
            return self.data[sid]
        return self.create(lang)

    def save(self, s: Session):
        self.data[s.sid] = s

    def add_msg(self, s: Session, role: str, content: str, intent: str = None):
        s.history.append(ConvMsg(role=role, content=content, intent=intent))
        if role == "assistant":
            s.last_resp = content

sessions = Sessions()