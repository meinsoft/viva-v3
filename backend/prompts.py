INTENT_PROMPT = {
    "en": """Classify intent:
- learn: wants to learn ("teach me", "explain")
- quiz: wants test ("test me", "quiz")
- question: asking something
- repeat: "repeat", "say again"
- back: "go back", "previous"
- stop: "stop", "pause"
- slower/faster: speed control
- example: wants example
- simplify: "I don't understand"
- continue: "next", "continue", "yes"
- unknown

JSON only: {{"intent": "<intent>", "topic": "<topic or null>", "confidence": <0-1>}}

Input: {user_input}""",

    "az": """Niyyəti təsnif et:
- learn: öyrənmək istəyir ("öyrət", "izah et")
- quiz: test istəyir ("test et", "sınaq")
- question: sual verir
- repeat: "təkrarla", "yenidən"
- back: "geri", "əvvəlki"
- stop: "dayan", "dayandır"
- slower/faster: sürət
- example: nümunə istəyir
- simplify: "başa düşmürəm"
- continue: "davam", "növbəti", "hə"
- unknown

JSON: {{"intent": "<intent>", "topic": "<topic or null>", "confidence": <0-1>}}

Input: {user_input}"""
}

def teach_prompt(topic, sec, prev, lang, profile):
    diff = "beginner" if profile.get("simplify_requests", 0) > 2 else "intermediate"
    
    if lang == "az":
        return f"""Viva - müəllim. Mövzu: {topic}, Bölmə: {sec}
Əvvəlki: {', '.join(prev) if prev else 'yoxdur'}
Çətinlik: {diff}

2-3 əsas nöqtə izah et. Praktik nümunə ver.
Sonda: "Davam edək, yoxsa nəyisə yenidən izah edim?"

{sec}-ci bölmə:"""
    
    return f"""Viva - tutor. Topic: {topic}, Section: {sec}
Previous: {', '.join(prev) if prev else 'none'}
Difficulty: {diff}

Explain 2-3 key points. Use practical examples.
End with: "Continue, or should I explain something again?"

Section {sec}:"""

def quiz_prompt(topics, num, score, total, prev_qa, task, answer, lang, profile):
    acc = score / total if total > 0 else 0.5
    diff = "easy" if acc < 0.4 else ("hard" if acc > 0.75 else "medium")
    
    if lang == "az":
        if task == "generate":
            return f"""Mövzular: {', '.join(topics)}
Sual #{num} | Bal: {score}/{total} | Çətinlik: {diff}

Aydın, sadə sual yarat:"""
        
        q = prev_qa[-1].get('question', '') if prev_qa else ''
        return f"""Sual: {q}
Cavab: "{answer}"

Qiymətləndir. Düzgündürsə təsdiq et, səhvdirsə düzəlt.
Sonda: "Başqa sual, yoxsa dayandıraq?"

Cavab:"""
    
    if task == "generate":
        return f"""Topics: {', '.join(topics)}
Q#{num} | Score: {score}/{total} | Difficulty: {diff}

Generate a clear question:"""
    
    q = prev_qa[-1].get('question', '') if prev_qa else ''
    return f"""Question: {q}
Answer: "{answer}"

Evaluate. Confirm if correct, gently correct if wrong.
End: "Another question, or stop?"

Response:"""

def qa_prompt(question, lang):
    if lang == "az":
        return f"Sual: {question}\n\nQısa, aydın cavab ver:"
    return f"Question: {question}\n\nGive a clear, concise answer:"

def simplify_prompt(text, lang):
    if lang == "az":
        return f"Bunu sadə izah et:\n\n{text}\n\nSadə:"
    return f"Explain this simply:\n\n{text}\n\nSimpler:"

def example_prompt(topic, ctx, lang):
    if lang == "az":
        return f'"{topic}" üçün 2-3 praktik nümunə:\n\nNümunələr:'
    return f'Give 2-3 practical examples for "{topic}":\n\nExamples:'