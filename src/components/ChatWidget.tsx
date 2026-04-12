"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, RefreshCw } from "lucide-react";
import { aiChatService } from "@/services/aiChatService";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export function ChatWidget() {
  const { locale } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [chatLanguage, setChatLanguage] = useState<string>(locale);

  useEffect(() => {
    setChatLanguage(locale);
  }, [locale]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: React.ReactNode}[]>([
    { role: 'assistant', content: chatLanguage === 'ar' ? 'مرحباً! أنا المساعد الذكي لعيادتك. كيف يمكنني مساعدتك اليوم؟' : 'Hi there! I am your MedFlow Assistant. How can I help you today?' }
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

    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: (
            <div className="flex flex-col gap-3">
              <p>{chatLanguage === 'ar' ? 'لتقديم أفضل مساعدة وتخصيص تجربتك، يرجى تسجيل الدخول أو إنشاء حساب جديد.' : 'To make it easier for me to help you contextually, please log in or create an account.'}</p>
              <div className="flex gap-2">
                <button onClick={() => { setIsOpen(false); router.push('/login'); }} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-200 transition-colors shrink-0">
                  {chatLanguage === 'ar' ? 'تسجيل الدخول' : 'Log In'}
                </button>
                <button onClick={() => { setIsOpen(false); router.push('/signup'); }} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-50 transition-colors shrink-0">
                  {chatLanguage === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                </button>
              </div>
            </div>
          )
        }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await aiChatService.sendMessage(userMessage, conversationId, chatLanguage);
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConversationId(undefined);
    setMessages([{ role: 'assistant', content: chatLanguage === 'ar' ? 'مرحباً! أنا المساعد الذكي لعيادتك. كيف يمكنني مساعدتك اليوم؟' : 'Hi there! I am your MedFlow Assistant. How can I help you today?' }]);
  };

  // Allow disabling via environment variable if needed
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED === 'false') {
    return null;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 shadow-2xl bg-white border border-gray-200 rounded-xl flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out" style={{ height: "500px", maxHeight: '80vh' }}>
          <div className="bg-blue-600 text-white p-4 font-semibold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span>{chatLanguage === 'ar' ? 'المساعد الذكي' : 'MedFlow Assistant'}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setChatLanguage(lang => lang === 'ar' ? 'en' : 'ar')}
                className="text-[11px] px-2 py-1 bg-white/20 hover:bg-white/30 rounded border border-white/20 transition-colors uppercase font-bold tracking-wider"
              >
                {chatLanguage === 'ar' ? 'EN' : 'عربي'}
              </button>
              <button onClick={handleReset} title="New Chat" className="hover:text-blue-200 transition-colors"><RefreshCw size={16} /></button>
              <button onClick={() => setIsOpen(false)} className="hover:text-gray-200"><X size={18} /></button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-br-sm' : 'bg-white text-gray-800 self-start border border-gray-100 rounded-bl-sm'}`}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="self-start bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <span className="text-xs text-gray-500 font-medium">Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={chatLanguage === 'ar' ? 'اكتب رسالتك...' : 'Ask me anything...'}
              className="flex-1 px-4 py-2.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-gray-200 bg-gray-50"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0"
            >
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
