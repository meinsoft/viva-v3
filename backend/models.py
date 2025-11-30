from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Mode(str, Enum):
    IDLE = "idle"
    LEARN = "learning"
    QUIZ = "quiz"
    QA = "qa"

class Intent(str, Enum):
    LEARN = "learn"
    QUIZ = "quiz"
    QUESTION = "question"
    REPEAT = "repeat"
    BACK = "back"
    STOP = "stop"
    SLOWER = "slower"
    FASTER = "faster"
    EXAMPLE = "example"
    SIMPLIFY = "simplify"
    CONTINUE = "continue"
    QUIZ_ANS = "quiz_answer"
    UNKNOWN = "unknown"

class Lang(str, Enum):
    EN = "en"
    AZ = "az"

class TextReq(BaseModel):
    text: str
    session_id: Optional[str] = None
    audio: bool = False
    lang: Optional[str] = None

class TextResp(BaseModel):
    text: str
    audio_b64: Optional[str] = None
    sid: str
    mode: str
    intent: str
    lang: str

class SessionInfo(BaseModel):
    sid: str
    mode: str
    topic: Optional[str]
    topics: list[str]
    quiz_score: int
    quiz_total: int
    conv_len: int
    created: str
    rate: float
    lang: str

class QuizSt(BaseModel):
    q: str = ""
    num: int = 0
    score: int = 0
    total: int = 0
    history: list[dict] = []

class LearnSt(BaseModel):
    topic: str = ""
    sec: int = 0
    covered: list[str] = []
    max_sec: int = 5

class Profile(BaseModel):
    simplify_cnt: int = 0
    example_cnt: int = 0
    sec_done: int = 0
    q_correct: int = 0
    q_total: int = 0
    pace: str = "normal"

    @property
    def accuracy(self) -> float:
        if(self.q_total>0):
            return self.q_correct/self.q_total
        else:
            return 0.5

    def to_dict(self) -> dict:
        return {
            "simplify_requests": self.simplify_cnt,
            "example_requests": self.example_cnt,
            "sections_completed": self.sec_done,
            "quiz_accuracy": self.accuracy,
            "preferred_pace": self.pace
        }

class ConvMsg(BaseModel):
    role: str
    content: str
    ts: datetime = Field(default_factory=datetime.now)
    intent: Optional[str] = None

class Session(BaseModel):
    sid: str
    mode: Mode = Mode.IDLE
    lang: Lang = Lang.EN
    history: list[ConvMsg] = []
    topics: list[str] = []
    topic: Optional[str] = None
    learn_st: Optional[LearnSt] = None
    quiz_st: Optional[QuizSt] = None
    profile: Profile = Field(default_factory=Profile)
    last_resp: str = ""
    rate: float = 1.0
    created: datetime = Field(default_factory=datetime.now)

    class Config:
        arbitrary_types_allowed = True