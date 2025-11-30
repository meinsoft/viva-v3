from typing import Optional
from config import MSG
from models import Session, Mode, Intent, LearnSt, QuizSt
from services import gemini, tts
from session import sessions
from prompts import teach_prompt, quiz_prompt, qa_prompt, simplify_prompt, example_prompt

class Assistant:
    def __init__(self):
        self.gemini = gemini
        self.tts = tts

    def msg(self, key: str, s: Session, **kw) -> str:
        return MSG[s.lang.value][key].format(**kw)

    async def process(self, text: str, s: Session) -> str:
        lang = s.lang.value
        
        if s.mode == Mode.QUIZ and s.quiz_st:
            intent, topic, _ = await self.gemini.detect_intent(text, lang)
            if intent not in [Intent.STOP, Intent.REPEAT, Intent.SIMPLIFY, Intent.EXAMPLE]:
                intent = Intent.QUIZ_ANS
        else:
            intent, topic, _ = await self.gemini.detect_intent(text, lang)

        sessions.add_msg(s, "user", text, intent.value)
        resp = await self._handle(intent, topic, text, s)
        sessions.add_msg(s, "assistant", resp, intent.value)
        sessions.save(s)
        return resp

    async def _handle(self, intent: Intent, topic: Optional[str], text: str, s: Session) -> str:
        h = {
            Intent.LEARN: self._learn,
            Intent.QUIZ: self._quiz,
            Intent.QUESTION: self._question,
            Intent.QUIZ_ANS: self._quiz_ans,
            Intent.REPEAT: self._repeat,
            Intent.BACK: self._back,
            Intent.STOP: self._stop,
            Intent.SLOWER: self._slower,
            Intent.FASTER: self._faster,
            Intent.EXAMPLE: self._example,
            Intent.SIMPLIFY: self._simplify,
            Intent.CONTINUE: self._continue,
            Intent.UNKNOWN: self._unknown,
        }
        return await h.get(intent, self._unknown)(topic, text, s)

    async def _learn(self, topic, text, s: Session) -> str:
        if not topic:
            return self.msg("no_topic", s)
        
        s.mode = Mode.LEARN
        s.topic = topic
        s.learn_st = LearnSt(topic=topic, sec=1)
        
        prompt = teach_prompt(topic, 1, [], s.lang.value, s.profile.to_dict())
        return await self.gemini.gen(prompt)

    async def _quiz(self, topic, text, s: Session) -> str:
        if not s.topics:
            return self.msg("no_topics", s)
        
        s.mode = Mode.QUIZ
        s.quiz_st = QuizSt(num=1)
        
        prompt = quiz_prompt(s.topics, 1, 0, 0, [], "generate", "", s.lang.value, s.profile.to_dict())
        resp = await self.gemini.gen(prompt)
        s.quiz_st.q = resp
        return resp

    async def _quiz_ans(self, topic, text, s: Session) -> str:
        if not s.quiz_st:
            return await self._question(topic, text, s)
        
        qa = s.quiz_st.history + [{"question": s.quiz_st.q}]
        prompt = quiz_prompt(s.topics, s.quiz_st.num, s.quiz_st.score, s.quiz_st.total, 
                            qa, "evaluate", text, s.lang.value, s.profile.to_dict())
        resp = await self.gemini.gen(prompt)
        
        correct = self._check_correct(resp)
        if correct:
            s.quiz_st.score += 1
            s.profile.q_correct += 1
        
        s.quiz_st.total += 1
        s.quiz_st.num += 1
        s.profile.q_total += 1
        s.quiz_st.history.append({"question": s.quiz_st.q, "answer": text, "correct": correct})
        s.quiz_st.q = resp
        return resp

    def _check_correct(self, resp: str) -> bool:
        r = resp.lower()
        pos = ["correct", "right", "excellent", "good", "yes", "exactly", "perfect",
               "düzgün", "doğru", "əla", "yaxşı", "bəli", "dəqiq", "mükəmməl", "afərin"]
        neg = ["incorrect", "wrong", "not quite", "actually", "the correct answer",
               "səhv", "düzgün deyil", "doğru cavab"]
        return any(w in r for w in pos) and not any(w in r for w in neg)

    async def _question(self, topic, text, s: Session) -> str:
        s.mode = Mode.QA
        if topic and topic not in s.topics:
            s.topics.append(topic)
            s.topic = topic
        prompt = qa_prompt(text, s.lang.value)
        return await self.gemini.gen(prompt)

    async def _repeat(self, topic, text, s: Session) -> str:
        return s.last_resp if s.last_resp else self.msg("no_prev", s)

    async def _back(self, topic, text, s: Session) -> str:
        if s.mode != Mode.LEARN or not s.learn_st:
            return self.msg("not_learning", s)
        if s.learn_st.sec <= 1:
            return self.msg("at_start", s)
        
        s.learn_st.sec -= 1
        if s.learn_st.covered:
            s.learn_st.covered.pop()
        
        prompt = teach_prompt(s.learn_st.topic, s.learn_st.sec, s.learn_st.covered, 
                             s.lang.value, s.profile.to_dict())
        return await self.gemini.gen(prompt)

    async def _stop(self, topic, text, s: Session) -> str:
        prev = s.mode
        s.mode = Mode.IDLE
        
        if prev == Mode.LEARN and s.topic and s.topic not in s.topics:
            s.topics.append(s.topic)
        
        if prev == Mode.QUIZ and s.quiz_st:
            sc, tot = s.quiz_st.score, s.quiz_st.total
            s.quiz_st = None
            return self.msg("quiz_stop", s, score=sc, total=tot)
        
        s.learn_st = None
        return self.msg("stopped", s)

    async def _slower(self, topic, text, s: Session) -> str:
        s.rate = max(0.5, s.rate - 0.25)
        return self.msg("slower", s, rate=s.rate)

    async def _faster(self, topic, text, s: Session) -> str:
        s.rate = min(2.0, s.rate + 0.25)
        return self.msg("faster", s, rate=s.rate)

    async def _example(self, topic, text, s: Session) -> str:
        t = s.topic or "general"
        ctx = s.last_resp[:500] if s.last_resp else ""
        s.profile.example_cnt += 1
        prompt = example_prompt(t, ctx, s.lang.value)
        return await self.gemini.gen(prompt)

    async def _simplify(self, topic, text, s: Session) -> str:
        if not s.last_resp:
            return self.msg("no_simplify", s)
        s.profile.simplify_cnt += 1
        if s.profile.simplify_cnt >= 3:
            s.profile.pace = "slow"
        prompt = simplify_prompt(s.last_resp, s.lang.value)
        return await self.gemini.gen(prompt)

    async def _continue(self, topic, text, s: Session) -> str:
        if s.mode != Mode.LEARN or not s.learn_st:
            return self.msg("not_learning_cont", s)
        
        s.learn_st.covered.append(f"Section {s.learn_st.sec}")
        s.learn_st.sec += 1
        s.profile.sec_done += 1
        
        if s.learn_st.sec > s.learn_st.max_sec:
            if s.topic and s.topic not in s.topics:
                s.topics.append(s.topic)
            done = s.topic
            s.mode = Mode.IDLE
            s.learn_st = None
            return self.msg("done", s, topic=done)
        
        prompt = teach_prompt(s.learn_st.topic, s.learn_st.sec, s.learn_st.covered,
                             s.lang.value, s.profile.to_dict())
        return await self.gemini.gen(prompt)

    async def _unknown(self, topic, text, s: Session) -> str:
        if topic and topic not in s.topics:
            s.topics.append(topic)
            s.topic = topic
        prompt = qa_prompt(text, s.lang.value)
        return await self.gemini.gen(prompt)

assistant = Assistant()