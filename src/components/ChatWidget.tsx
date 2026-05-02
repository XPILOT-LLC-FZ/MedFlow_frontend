"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, RefreshCw, Bot } from "lucide-react";
import { aiChatService } from "@/services/aiChatService";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const { locale } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [chatLanguage, setChatLanguage] = useState<string>(locale);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    setChatLanguage(locale);
    // Show bubble after a delay when component mounts
    const timer = setTimeout(() => setShowBubble(true), 15000);
    return () => clearTimeout(timer);
  }, [locale]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: React.ReactNode }[]>([
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

  if (process.env.NEXT_PUBLIC_CHAT_ENABLED === 'false') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="relative bg-blue-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-blue-200 mb-2 max-w-[240px] pointer-events-auto"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="absolute -top-2 -right-2 bg-white text-slate-400 rounded-full p-1 shadow-md hover:text-slate-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-sm font-bold leading-relaxed">
                Need help? Ask me anything
              </p>
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-blue-600 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowBubble(false);
          }}
          className="pointer-events-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-300 transition-all border-4 border-white relative"
        >
          {isOpen ? <X size={28} /> : <Bot className="h-8 w-8" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[110px] lg:bottom-32 right-6 lg:right-10 w-80 sm:w-96 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] bg-white border border-gray-100 rounded-3xl flex flex-col z-[100] overflow-hidden transition-all" 
            style={{ height: "550px", maxHeight: '80vh' }}
          >
            <div className="bg-blue-600 text-white p-5 font-bold flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <span className="text-[15px]">{chatLanguage === 'ar' ? 'المساعد الذكي' : 'MedFlow Assistant'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChatLanguage(lang => lang === 'ar' ? 'en' : 'ar')}
                  className="text-[10px] px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg border border-white/20 transition-colors uppercase font-bold tracking-wider"
                >
                  {chatLanguage === 'ar' ? 'EN' : 'عربي'}
                </button>
                <button onClick={handleReset} title="New Chat" className="p-2 hover:bg-white/10 rounded-lg transition-colors"><RefreshCw size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white self-end rounded-br-sm' 
                    : 'bg-white text-slate-700 self-start border border-slate-100 rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="self-start bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2.5 shadow-sm">
                  <Loader2 className="animate-spin text-blue-600" size={16} />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assistant is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={chatLanguage === 'ar' ? 'اكتب رسالتك...' : 'Ask me anything...'}
                className="flex-1 px-5 py-3 text-sm border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-200 border-slate-100 bg-slate-50/50 font-medium"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center justify-center shrink-0 shadow-lg shadow-blue-100"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
