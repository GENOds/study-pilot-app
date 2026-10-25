require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `
You are StudyPilot, a friendly, intelligent study coach for students.
Your job is to help with revision, understanding, and confidence.

Core behavior:
- Be warm, encouraging, and never judgmental.
- Explain concepts clearly, simply, and in a student-friendly way.
- Use examples and analogies when useful.
- If the user is stuck, break the topic into smaller steps.
- For difficult topics, explain as if the user is 15-18 years old.
- Keep answers concise but complete.
- Encourage active learning, not memorization-only.
- If the user asks for a quiz, output a short multiple-choice test.
- If the user asks for a summary, give a bullet-point recap with key concepts.
- If the user asks for a concept map, suggest main nodes and links.
- If the user asks for revision, make it a 5-minute plan.
- Always answer like a smart, motivating tutor, not like a dry textbook.
- Keep the tone playful, supportive, and academically useful.

StudyPilot style:
- "Let’s make this easier."
- "You’re not failing — you’re learning."
- "Here’s the simple version first."
- "I’ll turn this into a quick quiz and recap."

Never:
- Be rude, dismissive, or condescending.
- Overcomplicate explanations.
- Pretend to know facts the user did not provide.
- Give unsafe or harmful advice.

When the user is a creator or owner of the app, treat them as a premium owner and unlock all advanced features in conversation.
`;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

function safeModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

async function callGemini(prompt, imageData = null) {
  const model = safeModel();
  if (!model) {
    throw new Error('GEMINI_API_KEY missing. Add it to your .env file.');
  }

  const request = {
    systemInstruction: SYSTEM_PROMPT,
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  };

  if (imageData) {
    request.contents[0].parts.push({
      inlineData: {
        mimeType: imageData.mimeType || 'image/jpeg',
        data: imageData.base64
      }
    });
  }

  const result = await model.generateContent(request);
  const response = await result.response;
  return response.text();
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true, hasGemini: !!GEMINI_API_KEY });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Missing message' });
  }

  try {
    const text = await callGemini(`You are StudyPilot and the user is working with the app. Answer the question helpfully and keep it clear. User asks: ${message}`);
    res.json({ reply: text.trim() });
  } catch (error) {
    const messageText = String(error?.message || 'Unknown error');
    res.status(500).json({ error: messageText });
  }
});

app.post('/api/quiz', async (req, res) => {
  const { topic } = req.body || {};
  const subject = topic || 'general science';

  try {
    const text = await callGemini(`Create a short multiple-choice quiz for the topic: ${subject}. Output JSON with fields: question, options, correctAnswer, explanation. Keep it concise and suitable for students.`);
    res.json({ result: text.trim() });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || 'Unknown error') });
  }
});

app.post('/api/summary', async (req, res) => {
  const { text } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Missing text' });
  }

  try {
    const answer = await callGemini(`Summarize this in simple language for students. Keep it clear and easy to remember. Text: ${text}`);
    res.json({ summary: answer.trim() });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || 'Unknown error') });
  }
});

app.post('/api/image-summary', async (req, res) => {
  const { image } = req.body || {};
  if (!image || !image.base64) {
    return res.status(400).json({ error: 'Missing image' });
  }

  try {
    const answer = await callGemini(
      'Analyze this image and produce a clean student-friendly summary of the main ideas, key facts, and what matters most. Keep it clear, concise, and useful for revision.',
      { mimeType: image.mimeType || 'image/jpeg', base64: image.base64 }
    );
    res.json({ summary: answer.trim() });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || 'Unknown error') });
  }
});

app.post('/api/concept-map', async (req, res) => {
  const { topic } = req.body || {};
  const subject = topic || 'Roman Empire';

  try {
    const answer = await callGemini(`Create a simple concept map for: ${subject}. Return JSON: { nodes: ["node1", "node2"], edges: [["node1","node2"]] } and a short explanation.`);
    res.json({ result: answer.trim() });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || 'Unknown error') });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`StudyPilot server running on http://localhost:${port}`);
  console.log('Gemini status:', GEMINI_API_KEY ? 'connected' : 'missing API key');
});
