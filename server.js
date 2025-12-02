import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.GROQ_API_KEY ? 'Yes ✅' : 'No ❌');
console.log('🔑 API Key format:', process.env.GROQ_API_KEY?.substring(0, 10) + '...');

const conversations = new Map();

const SYSTEM_PROMPT = `Kamu adalah asisten AI customer service yang ramah dan profesional untuk toko online.

Tugasmu:
- Jawab pertanyaan produk dengan jelas
- Bantu tracking dan status pesanan
- Tangani komplain dengan empati
- Berikan rekomendasi yang relevan
- Proses permintaan return/refund

Selalu jawab dalam Bahasa Indonesia, singkat tapi informatif, dan ramah.`;

// ============ API ROUTES (MUST BE BEFORE STATIC FILES) ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const convId = conversationId || `conv_${Date.now()}`;
    let history = conversations.get(convId) || [];

    history.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      'Maaf, saya tidak bisa memproses permintaan saat ini.';

    history.push({ role: 'assistant', content: aiResponse });

    if (history.length > 20) history = history.slice(-20);
    conversations.set(convId, history);

    res.json({
      response: aiResponse,
      conversationId: convId,
      messageCount: Math.floor(history.length / 2)
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const totalConversations = conversations.size;
  const totalMessages = Array.from(conversations.values())
    .reduce((sum, conv) => sum + conv.length, 0);

  res.json({
    totalConversations,
    totalMessages,
    averageMessages: totalConversations > 0 
      ? (totalMessages / totalConversations).toFixed(1) 
      : 0
  });
});


app.use(express.static(path.join(__dirname, 'dist')));

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading application");
    }
  });
});



// ============ START SERVER ============

app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 AI Chatbot Server Running        ║
╚════════════════════════════════════════╝
  
📍 Port: ${port}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📊 API Health: http://localhost:${port}/api/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});