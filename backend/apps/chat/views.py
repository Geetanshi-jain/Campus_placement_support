"""
Chat views — Function-Based Views (FBV)
Endpoints:
  POST /api/chat/ask/       — RAG-powered Q&A grounded in placement data
  POST /api/chat/hr-brief/  — Web-search augmented HR round prep (no FAISS)
"""
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from apps.experiences.models import Experience


def _build_rag_prompt(question: str, chunks: list[dict], history: list[dict]) -> tuple:
    """Build the system prompt and messages list for a Gemini RAG call."""
    if chunks:
        context_parts = []
        for i, c in enumerate(chunks, 1):
            context_parts.append(
                f"[Source {i} — {c['company']} | Batch {c['batch']} | {c['verdict'].upper()} | {c['chunk_type']}]\n{c['chunk_text']}"
            )
        context_str = "\n\n---\n\n".join(context_parts)
        system = (
            "You are an expert placement advisor for IIPS (Institute of Information Technology & Management). "
            "Answer the student's question using ONLY the placement experience data provided below. "
            "Cite sources by their [Source N] tag when relevant. "
            "Pay close attention to details like role, CTC, rounds, and tips provided in the data. "
            "If the data doesn't contain enough information, say so honestly.\n\n"
            f"PLACEMENT DATA:\n{context_str}"
        )
    else:
        # Fallback: no FAISS data — use recent summaries
        recent = Experience.objects.order_by("-created_at")[:10]
        summaries = "\n".join(
            f"- {e.company} ({e.batch}, {e.verdict}): {e.overall_process_summary[:200]}"
            for e in recent if e.overall_process_summary
        )
        system = (
            "You are an expert placement advisor for IIPS. "
            "Here is some recent placement data:\n" + (summaries or "No data available yet.") +
            "\n\nAnswer the student's question as helpfully as possible."
        )

    messages = []
    for h in (history or []):
        if h.get("role") in ("user", "assistant"):
            role = "user" if h["role"] == "user" else "model"
            messages.append({"role": role, "parts": [{"text": h["content"]}]})
    messages.append({"role": "user", "parts": [{"text": question}]})
    return system, messages


@api_view(["POST"])
@permission_classes([AllowAny])
def ask(request):
    """
    RAG-powered placement Q&A.
    Retrieves relevant experience chunks via FAISS then calls Gemini to answer.
    """
    question = request.data.get("question", "").strip()
    if not question:
        return Response({"error": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

    history = request.data.get("history", [])
    company_filter = request.data.get("company")
    batch_filter = request.data.get("batch")
    verdict_filter = request.data.get("verdict")

    # Step 1: retrieve relevant chunks
    chunks = []
    try:
        from apps.chat.retrieval import retrieve_chunks_from_csv
        chunks = retrieve_chunks_from_csv(
            question,
            top_k=10,
            company_filter=company_filter,
            batch_filter=batch_filter,
            verdict_filter=verdict_filter,
        )
    except Exception as e:
        print(f"[Retrieval warning] {e}")

    # Step 2: call Gemini (or return dev placeholder if no key)
    if not settings.GEMINI_API_KEY:
        answer = (
            "⚠️ No GEMINI_API_KEY set. Add it to backend/.env to enable AI responses. "
            f"I found {len(chunks)} relevant placement records for your question: '{question}'. "
            "Once you add the API key, I'll give you a detailed, grounded answer."
        )
        sources = [{"submission_id": c["submission_id"], "company": c["company"], "batch": c["batch"]} for c in chunks]
        return Response({"answer": answer, "sources": sources})

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        system, messages = _build_rag_prompt(question, chunks, history)

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=system,
            )
        )
        answer = response.text
    except Exception as e:
        return Response({"error": f"Gemini API error: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    sources = [
        {"submission_id": c["submission_id"], "company": c["company"], "batch": c["batch"], "chunk_type": c["chunk_type"]}
        for c in chunks
    ]
    return Response({"answer": answer, "sources": sources})


@api_view(["POST"])
@permission_classes([AllowAny])
def hr_brief(request):
    """
    Generate an HR round prep brief for a given company using Gemini with web search.
    """
    company = request.data.get("company", "").strip()
    if not company:
        return Response({"error": "company name is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not settings.GEMINI_API_KEY:
        return Response({
            "brief": f"⚠️ No GEMINI_API_KEY set. Add it to backend/.env to enable HR Brief generation for {company}.",
            "company": company,
        })

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = (
            f"You are helping an engineering student prepare for an HR interview at {company}. "
            f"Please provide a comprehensive HR interview preparation brief for {company} that includes:\n"
            f"1. Company overview (founding year, headquarters, industry)\n"
            f"2. CEO/CTO/key leadership names\n"
            f"3. Core products/services and tech stack\n"
            f"4. Recent news or developments (last 1-2 years)\n"
            f"5. Company culture and values\n"
            f"6. Common HR interview questions specific to {company}\n"
            f"7. Why do you want to work at {company}? — suggested talking points\n\n"
            f"Be concise but thorough. Format with clear headings."
        )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        brief = response.text
    except Exception as e:
        return Response({"error": f"Gemini API error: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({"brief": brief, "company": company})
