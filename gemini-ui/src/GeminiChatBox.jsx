import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
const GEMINI_API_KEY = ''; // Replace with your actual Gemini API key

const GeminiChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: input }] }]
        })
      });

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      const updated = [...newMessages, { role: 'model', content: reply }];
      setMessages(updated);

      const pair = { prompt: input, response: reply };
      console.log("📤 Sending to Flask:", pair);

      const saveRes = await fetch('http://localhost:8000/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pair)
      });

      const saveResult = await saveRes.json();
      console.log("✅ Flask responded:", saveResult);

      /*await fetch('http://localhost:8000/train', { method: 'POST' });
      console.log("🧠 Fine-tuning request sent to Flask backend.");*/
    } catch (err) {
      console.error('❌ Gemini or Flask error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="border rounded p-4 h-96 overflow-y-scroll mb-4 bg-white shadow">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded whitespace-pre-wrap text-left max-w-full break-words ${msg.role === 'user' ? 'bg-blue-200' : 'bg-gray-200'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </span>
          </div>
        ))}
        {loading && <p className="text-gray-500">Gemini is thinking...</p>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GeminiChatBox;
