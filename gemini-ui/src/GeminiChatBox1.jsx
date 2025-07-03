import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
const GeminiChatBox = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = ''; // Replace this
  const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';



  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: input }] }]
        })
      });

      const data = await response.json();
      //console.log('Gemini response:', data);
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + error.message }]);
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="max-w-3xl mx-auto p-4 font-sans">
    <div className="border rounded-lg p-4 h-[500px] overflow-y-auto mb-4 bg-gray-50 shadow-inner">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap break-words ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-sm text-gray-400 italic">
          Gemini is thinking…
        </div>
      )}
    </div>

    <div className="flex gap-2">
      <input
        className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
  </div>
);
};

export default GeminiChatBox;
