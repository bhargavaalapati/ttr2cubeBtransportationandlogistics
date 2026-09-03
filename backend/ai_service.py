import os
import json

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

def get_ai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None
    return genai.Client(api_key=api_key)

def parse_commuter_report(text: str) -> dict:
    client = get_ai_client()
    if not client:
        # Fallback if API key is not set
        return {
            "crowding": 80 if "packed" in text.lower() or "full" in text.lower() else 30,
            "did_stop": False if "didn't stop" in text.lower() or "skipped" in text.lower() else True,
            "route": "218D",
            "summary": "Parsed via fallback (GEMINI_API_KEY not configured)."
        }

    prompt = f"""
    You are an AI transit analyst for Hyderabad public transport.
    Analyze the following commuter report and extract structured values:
    Report: "{text}"

    Return ONLY a raw JSON object with these keys:
    - "crowding": integer from 0 (empty) to 100 (packed/overcrowded)
    - "did_stop": boolean (false if bus skipped the stop or ghost stop, true otherwise)
    - "route": string (detected route number like "218D", or "218D" if unspecified)
    - "summary": short 1-sentence summary of commuter feedback
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        client.close()
        return data
    except Exception as e:
        client.close()
        return {
            "crowding": 75,
            "did_stop": True,
            "route": "218D",
            "summary": f"Fallback due to AI error: {str(e)}"
        }

def explain_trip_plan(plan: dict) -> str:
    """Explain provider-returned route options without creating new facts or fares."""
    options = plan.get("options", [])
    recommended_id = plan.get("recommendation_id")
    recommended = next((option for option in options if option.get("id") == recommended_id), None)
    if not recommended:
        return "No verified journey option is available right now."

    fallback = (
        f"{recommended['mode']} is the quickest verified option at "
        f"{recommended['duration_min']} minutes. {recommended['fare_type']}."
    )
    client = get_ai_client()
    if not client:
        return fallback

    prompt = f"""
    You are BoardWise, a careful transit assistant. Explain the recommended
    journey in one concise sentence. Use ONLY the verified values below.
    Never invent a fare, timetable, availability, or transit provider.

    Recommendation: {recommended}
    Provider notice: {plan.get('provider_notice')}
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1),
        )
        client.close()
        return response.text.strip() or fallback
    except Exception:
        client.close()
        return fallback

def answer_trip_question(question: str, plan: dict) -> dict:
    """Return a grounded answer and the exact evidence supplied to the model."""
    recommendation = plan.get("recommendation", {})
    evidence = recommendation.get("evidence", [])
    uncertainties = recommendation.get("uncertainties", [])
    options = plan.get("options", [])
    fallback = (
        f"The current recommendation is {recommendation.get('option_id', 'the available route')} "
        f"because it is the quickest verified option. Check the evidence below before travelling."
    )
    client = get_ai_client()
    if not client:
        return {"answer": fallback, "evidence": evidence, "uncertainties": uncertainties, "provider": "BoardWise fallback"}

    prompt = f"""
You are BoardWise, a careful transit decision assistant. Answer the commuter's
question using ONLY the verified trip plan below. Never invent fares, routes,
timings, availability, safety claims, or provider facts. If the data is missing,
say that it is unavailable. Keep the answer under 90 words.

Question: {question}
Trip plan: {options}
Recommendation evidence: {evidence}
Uncertainties: {uncertainties}
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1),
        )
        client.close()
        answer = response.text.strip() or fallback
    except Exception:
        client.close()
        answer = fallback
    return {"answer": answer, "evidence": evidence, "uncertainties": uncertainties, "provider": "Gemini + verified plan"}
