'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Trash2,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'carsai_chat_messages';
const SESSION_KEY = 'carsai_chat_session';
const MAX_MESSAGES = 50; // Max messages to keep in local memory

// ──────────────────────────────────────────────
// Local Session Memory (localStorage)
// ──────────────────────────────────────────────

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.slice(-MAX_MESSAGES);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Ignore storage errors
  }
}

function clearMessages() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  } catch {
    return `session-${Date.now()}`;
  }
}

// ──────────────────────────────────────────────
// Enhanced AI Chat Assistant Component
// ──────────────────────────────────────────────

export function AiChatAssistant() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Quick questions ──
  const quickQuestions = [
    t('chat.quickQuestion1'),
    t('chat.quickQuestion2'),
    t('chat.quickQuestion3'),
    t('chat.quickQuestion4'),
  ];

  // ── Initialize session and load memory ──
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
  }, []);

  // ── Save messages to localStorage on change ──
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Focus input on open ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Initialize greeting if no messages ──
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: t('chat.greeting'),
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length, t]);

  // ── Send message to API ──
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasError(false);

    try {
      // Include up to 10 recent messages for context/memory
      const contextMessages = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          context: contextMessages,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update session ID if server provides one
        if (data.sessionId) {
          setSessionId(data.sessionId);
          try {
            localStorage.setItem(SESSION_KEY, data.sessionId);
          } catch { /* ignore */ }
        }
      } else {
        setHasError(true);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('chat.error'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      setHasError(true);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('chat.error'),
        timestamp: Date.now(),
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

  // ── Clear chat history ──
  const handleClearHistory = () => {
    setMessages([]);
    clearMessages();
    setSessionId(getOrCreateSessionId());
    // Add fresh greeting
    const greeting: ChatMessage = {
      id: 'greeting-new',
      role: 'assistant',
      content: t('chat.greeting'),
      timestamp: Date.now(),
    };
    setMessages([greeting]);
  };

  // ── Retry last failed message ──
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove error messages after the last user message
      setMessages(prev => prev.filter(m => m.timestamp <= lastUserMsg.timestamp));
      sendMessage(lastUserMsg.content);
    }
  };

  // ── Format timestamp ──
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ── Animation variants ──
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.85,
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
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all px-4 py-3 group"
            aria-label={t('chat.open')}
          >
            <MessageCircle className="size-5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-sm font-medium">{t('chat.title')}</span>
            <Badge className="size-5 p-0 bg-yellow-400 text-emerald-900 text-[10px] flex items-center justify-center border-0 rounded-full">
              <Sparkles className="size-3" />
            </Badge>
            {/* Memory indicator */}
            {messages.length > 2 && (
              <span className="hidden sm:inline text-xs text-emerald-200 bg-emerald-800/50 px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
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
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[75vh]"
          >
            <Card className="border-emerald-200/60 dark:border-emerald-800/60 shadow-2xl shadow-emerald-900/20 h-full flex flex-col overflow-hidden rounded-2xl">
              {/* ── Header ── */}
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-600 text-white rounded-t-2xl border-b border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {t('chat.title')}
                      </CardTitle>
                      <p className="text-xs text-emerald-200/80">{t('chat.subtitle')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {messages.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-emerald-200 hover:bg-emerald-800/50 hover:text-white"
                        onClick={handleClearHistory}
                        aria-label="Clear history"
                        title="Limpar histórico"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-emerald-200 hover:bg-emerald-800/50 hover:text-white"
                      onClick={() => setIsOpen(false)}
                      aria-label={t('chat.close')}
                    >
                      <Minimize2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-emerald-200 hover:bg-emerald-800/50 hover:text-white"
                      onClick={() => {
                        setIsOpen(false);
                        handleClearHistory();
                      }}
                      aria-label={t('common.close')}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Session memory indicator ── */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/10 text-emerald-200 border-emerald-400/20 text-[10px] px-2 py-0.5">
                    <Globe className="size-2.5 mr-1" />
                    DB Connected
                  </Badge>
                  {messages.length > 1 && (
                    <Badge className="bg-white/10 text-emerald-200 border-emerald-400/20 text-[10px] px-2 py-0.5">
                      <Sparkles className="size-2.5 mr-1" />
                      {messages.length - 1} messages in memory
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* ── Messages Area ── */}
              <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-background to-muted/10">
                <ScrollArea className="h-[calc(75vh-180px)] sm:h-[380px] px-4 py-3">
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
                          <div className="shrink-0 size-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center shadow-sm">
                            <Bot className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2.5 text-sm ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-white dark:bg-emerald-950/50 text-foreground border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.role === 'user' ? 'text-emerald-200/60' : 'text-muted-foreground/50'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="shrink-0 size-7 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20">
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
                        <div className="shrink-0 size-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                          <Bot className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div className="bg-white dark:bg-emerald-950/50 rounded-xl px-4 py-3 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="animate-bounce size-2 rounded-full bg-emerald-600 [animation-delay:0ms]" />
                              <div className="animate-bounce size-2 rounded-full bg-emerald-600 [animation-delay:150ms]" />
                              <div className="animate-bounce size-2 rounded-full bg-emerald-600 [animation-delay:300ms]" />
                            </div>
                            <span className="text-xs text-muted-foreground">{t('chat.thinking')}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Error with retry ── */}
                    {hasError && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2 justify-start"
                      >
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2 border border-red-200/60 dark:border-red-800/40">
                          <p className="text-sm text-red-700 dark:text-red-400 mb-2">{t('chat.error')}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-200 text-red-700 hover:bg-red-100"
                            onClick={handleRetry}
                          >
                            <RefreshCw className="size-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* ── Quick Questions ── */}
                {messages.length <= 2 && !isLoading && (
                  <div className="px-4 pb-2">
                    <Separator className="mb-2 bg-emerald-200/40 dark:bg-emerald-800/40" />
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Perguntas frequentes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickQuestions.map((question, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1.5 px-3 border-emerald-300/60 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-lg shadow-sm transition-all hover:shadow-md"
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
              <div className="border-t border-emerald-200/40 dark:border-emerald-800/40 p-3 bg-gradient-to-r from-emerald-50/60 to-green-50/60 dark:from-emerald-950/40 dark:to-green-950/40">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    disabled={isLoading}
                    className="text-sm border-emerald-300/60 dark:border-emerald-700/60 focus-visible:ring-emerald-500 bg-white dark:bg-background rounded-lg"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shrink-0 rounded-lg shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">
                  Powered by Carsai AI · Conectado ao banco de dados · Memória local por sessão
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
