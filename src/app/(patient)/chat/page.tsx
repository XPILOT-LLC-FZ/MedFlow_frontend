"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, RefreshCw } from "lucide-react";
import { aiChatService } from "@/services/aiChatService";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChatPage() {
  const { locale } = useTranslation();
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: locale === 'ar' ? 'أهلاً بك في المحادثة الآمنة لعيادتك! يمكنني مساعدتك في حجز المواعيد أو الإجابة على الأسئلة العامة. كيف يمكنني مساعدتك اليوم؟' : 'Welcome to your MedFlow secure chat! I can help you schedule appointments, provide medical information from your portal, or answer general clinic FAQs. How can I assist you today?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(userMessage, conversationId, locale);
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConversationId(undefined);
    setMessages([{ role: 'assistant', content: locale === 'ar' ? 'أهلاً بك في المحادثة الآمنة لعيادتك! يمكنني مساعدتك في حجز المواعيد أو الإجابة على الأسئلة العامة. كيف يمكنني مساعدتك اليوم؟' : 'Welcome to your MedFlow secure chat! I can help you schedule appointments, provide medical information from your portal, or answer general clinic FAQs. How can I assist you today?' }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Bot size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{locale === 'ar' ? 'المساعد الذكي' : 'MedFlow Assistant'}</h1>
          <p className="text-sm text-gray-500">{locale === 'ar' ? 'متصل دائماً ومستعد للمساعدة' : 'Always online and ready to help'}</p>
        </div>
        <button 
          onClick={handleReset} 
          title="New Conversation"
          className="p-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-center shrink-0 shadow-sm"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[70%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-md'}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={18} />
              <span className="text-sm text-gray-500 font-medium">{locale === 'ar' ? 'جاري كتابة الرد...' : 'Generating response...'}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3 relative max-w-4xl mx-auto">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={locale === 'ar' ? 'اكتب رسالتك بأمان...' : 'Type your message securely...'}
            className="flex-1 w-full pl-5 pr-14 py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-sm"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <Send size={20} className="translate-x-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
