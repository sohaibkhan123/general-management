import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { ChatBubbleIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface ProjectChatProps {
  project: Project;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ project }) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    // Optimistically add user message
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Prepare Context with Project Data
      const contextData = {
        projectName: project.name,
        industry: project.industry,
        description: project.description,
        fields: project.fields.map(f => f.name),
        // Simplified items for context window efficiency
        items: project.items.map(item => {
           const simplified: any = {};
           project.fields.forEach(f => simplified[f.name] = item[f.name]);
           return simplified;
        })
      };

      const systemPrompt = `
        You are an intelligent project assistant for "${project.name}" (${project.industry}).
        
        Here is the current project dataset in JSON:
        ${JSON.stringify(contextData)}

        INSTRUCTIONS:
        1. Answer questions strictly based on the provided dataset.
        2. You can calculate counts, sums, and status distributions.
        3. If asked about "Cutting", "Welding", etc., refer to the date fields in the items.
        4. Be concise and helpful.
      `;

      // 2. Call Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Format history for the model
      const historyText = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const finalPrompt = `${systemPrompt}\n\nChat History:\n${historyText}\n\nAssistant:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: finalPrompt,
      });

      const aiText = response.text || "I couldn't generate a response.";

      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error connecting to the AI service. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
        {/* Chat Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                    <ChatBubbleIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Project AI Chat</h3>
                    <p className="text-xs text-slate-500">Ask questions about your data</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded">Powered by Gemini</span>
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                    <ChatBubbleIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Ask me anything about <strong>{project.name}</strong>!</p>
                    <p className="text-xs mt-2">Try: "How many items have completed Welding?"</p>
                </div>
            )}
            
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-brand-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}>
                        {msg.role === 'ai' && <span className="block text-xs font-bold text-brand-600 mb-1">AI Assistant</span>}
                        {msg.content}
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                />
                <button 
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    Send
                </button>
            </div>
        </form>
    </div>
  );
};