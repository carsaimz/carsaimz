'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ──────────────────────────────────────────────
// AI Chat Assistant Component
// ──────────────────────────────────────────────

export function AiChatAssistant() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Quick questions ──
  const quickQuestions = [
    t('chat.quickQuestion1'),
    t('chat.quickQuestion2'),
    t('chat.quickQuestion3'),
    t('chat.quickQuestion4'),
  ];

  // ── Initialize with greeting ──
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: t('chat.greeting'),
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, t]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Focus input on open ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Send message to API ──
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          context: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('chat.error'),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ── Handle quick question click ──
  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // ── Animation variants ──
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 20 },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <>
      {/* ── Floating Chat Bubble ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-shadow flex items-center justify-center group"
            aria-label={t('chat.open')}
          >
            <MessageCircle className="size-6 group-hover:scale-110 transition-transform" />
            <Badge className="absolute -top-1 -right-1 size-4 p-0 bg-yellow-400 text-emerald-900 text-[10px] flex items-center justify-center border-0">
              <Sparkles className="size-2.5" />
            </Badge>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-48px)] sm:w-[380px] max-h-[70vh]"
          >
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl shadow-emerald-600/10 h-full flex flex-col overflow-hidden">
              {/* ── Header ── */}
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot className="size-4" />
                    {t('chat.title')}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-white hover:bg-emerald-800"
                      onClick={() => setIsOpen(false)}
                      aria-label={t('chat.close')}
                    >
                      <Minimize2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-white hover:bg-emerald-800"
                      onClick={() => {
                        setIsOpen(false);
                        setMessages([]);
                      }}
                      aria-label={t('common.close')}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-emerald-100">{t('chat.subtitle')}</p>
              </CardHeader>

              {/* ── Messages Area ── */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(70vh-140px)] sm:h-[340px] px-4 py-3">
                  <div ref={scrollRef} className="flex flex-col gap-3">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        className={`flex gap-2 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="shrink-0 size-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <Bot className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-foreground border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="shrink-0 size-7 rounded-full bg-emerald-600 flex items-center justify-center">
                            <User className="size-3.5 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* ── Loading indicator ── */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2 justify-start"
                      >
                        <div className="shrink-0 size-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                          <Bot className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-1.5">
                            <div className="animate-bounce size-1.5 rounded-full bg-emerald-600 [animation-delay:0ms]" />
                            <div className="animate-bounce size-1.5 rounded-full bg-emerald-600 [animation-delay:150ms]" />
                            <div className="animate-bounce size-1.5 rounded-full bg-emerald-600 [animation-delay:300ms]" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{t('chat.thinking')}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* ── Quick Questions ── */}
                {messages.length <= 2 && !isLoading && (
                  <div className="px-4 pb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickQuestions.map((question, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1 px-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* ── Input Area ── */}
              <div className="border-t border-emerald-200 dark:border-emerald-800 p-3 bg-emerald-50/50 dark:bg-emerald-950/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    disabled={isLoading}
                    className="text-sm border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
