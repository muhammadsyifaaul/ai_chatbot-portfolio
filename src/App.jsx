import { useState, useRef, useEffect } from 'react';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Halo! Saya AI Assistant. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.PROD ? '' : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats error:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response 
        }]);
        if (!conversationId) setConversationId(data.conversationId);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Maaf, terjadi kesalahan. Silakan coba lagi.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: '📦', text: 'Status Pesanan', query: 'Cek status pesanan saya' },
    { icon: '🚚', text: 'Tracking', query: 'Tracking pengiriman' },
    { icon: '🏷️', text: 'Promo', query: 'Ada promo apa hari ini?' },
    { icon: '❓', text: 'Bantuan', query: 'Saya butuh bantuan' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-soft">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Customer Service
                </h1>
                <p className="text-sm text-gray-600">Powered by Generative AI</p>
              </div>
            </div>
            
            {stats && (
              <div className="hidden md:flex gap-4 text-sm">
                <div className="bg-indigo-50 px-3 py-2 rounded-lg">
                  <div className="text-indigo-600 font-semibold">{stats.totalMessages}</div>
                  <div className="text-gray-600 text-xs">Messages</div>
                </div>
                <div className="bg-purple-50 px-3 py-2 rounded-lg">
                  <div className="text-purple-600 font-semibold">{stats.totalConversations}</div>
                  <div className="text-gray-600 text-xs">Chats</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white shadow-2xl flex flex-col" style={{ height: '500px' }}>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 animate-slide-up ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <span className="text-xl">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                </div>
                
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(action.query)}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 border border-gray-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md"
                >
                  <span>{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan Anda..."
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none disabled:bg-gray-100 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-3xl shadow-2xl p-4 text-center">
          <p className="text-sm text-gray-600">
            Built with ❤️ by <span className="font-semibold text-indigo-600">Muhammad Syifaaul Jinan</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">AI-Powered Customer Service Portfolio</p>
        </div>

      </div>
    </div>
  );
}

export default App;