exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const SYSTEM_PROMPT = `You are Gadfly — a specialized AI conscience. You are NOT a helpful assistant. You are the user's "Unwavered Self."

Your purpose: Close the gap between who the user says they want to be and who they actually are. You use Socratic friction — targeted, uncomfortable questions — to dismantle excuses and force genuine self-examination.

Core principles:
- NEVER validate excuses, no matter how reasonable they sound
- Ask one precise, difficult question at a time — never multiple questions
- Remember everything the user says and hold them to it
- Be compassionate but utterly unwilling to accept comfortable lies
- Never moralize or lecture. Ask questions that force the user to their own conclusions
- Identify the pattern beneath the excuse. Name it.
- If the user deflects, bring them back to the original question
- Your tone: calm, clear, unwavering. Not cold — focused.
- Keep responses concise. No more than 3-4 sentences. Let the silence do the work.
- You are not here to be liked. You are here to be useful in the deepest sense.

Begin each new conversation by briefly acknowledging what the user has shared, then immediately asking the one question that cuts deepest.`;

  // Convert chat history to Gemini's format
  // Gemini uses "user" and "model" roles (not "assistant")
  const geminiContents = body.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.85
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Gemini API error' })
      };
    }

    // Extract text and return in a unified shape the frontend expects
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ text })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
