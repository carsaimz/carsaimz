'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  Globe,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch } from '@/lib/api-fetch';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type WindowState = 'closed' | 'normal' | 'minimized' | 'fullscreen';

const STORAGE_KEY = 'carsai_chat_messages';
const SESSION_KEY = 'carsai_chat_session';
const POSITION_KEY = 'carsai_chat_position';
const MAX_MESSAGES = 50;

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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_MESSAGES))
    );
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

function loadPosition(): { x: number; y: number } {
  try {
    const stored = localStorage.getItem(POSITION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  // Default position: bottom-right area
  return { x: 0, y: 0 };
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ x, y }));
  } catch {
    // Ignore
  }
}

// ──────────────────────────────────────────────
// Hook: useDraggable
// ──────────────────────────────────────────────

function useDraggable(isEnabled: boolean) {
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth drag performance - start at 0, set from effect
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  // Store current position for pointer tracking (not accessed during render)
  const currentPosition = useRef({ x: 0, y: 0 });

  // Load saved position after mount
  useEffect(() => {
    const saved = loadPosition();
    currentPosition.current = saved;
    motionX.set(saved.x);
    motionY.set(saved.y);
  }, [motionX, motionY]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isEnabled) return;
      // Only drag from header, not from buttons
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[data-no-drag]')
      ) {
        return;
      }

      isDragging.current = true;
      dragStart.current = {
        x: e.clientX - currentPosition.current.x,
        y: e.clientY - currentPosition.current.y,
      };

      // Capture pointer for reliable tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isEnabled]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;

      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;

      // Constrain to viewport bounds
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const constrainedX = Math.max(
          0,
          Math.min(vw - rect.width, newX)
        );
        const constrainedY = Math.max(
          0,
          Math.min(vh - rect.height, newY)
        );

        currentPosition.current = { x: constrainedX, y: constrainedY };
        motionX.set(constrainedX);
        motionY.set(constrainedY);
      }
    },
    [motionX, motionY]
  );

  const onPointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      savePosition(currentPosition.current.x, currentPosition.current.y);
    }
  }, []);

  // Reset position when transitioning to fullscreen or when disabled
  useEffect(() => {
    if (!isEnabled) {
      const saved = loadPosition();
      currentPosition.current = saved;
      motionX.set(saved.x);
      motionY.set(saved.y);
    }
  }, [isEnabled, motionX, motionY]);

  return {
    containerRef,
    motionX,
    motionY,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isDragging: isDragging,
  };
}

// ──────────────────────────────────────────────
// Animation Variants
// ──────────────────────────────────────────────

const bubbleVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.2 },
  },
};

const windowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
    y: 40,
    transformOrigin: 'bottom right',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transformOrigin: 'bottom right',
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    y: 40,
    transformOrigin: 'bottom right',
    transition: { duration: 0.2 },
  },
};

const minimizedVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.8,
    transformOrigin: 'bottom center',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transformOrigin: 'bottom center',
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: 60,
    scale: 0.8,
    transformOrigin: 'bottom center',
    transition: { duration: 0.15 },
  },
};

const fullscreenVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 250, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.2 },
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

// ──────────────────────────────────────────────
// Memoized Chat Input Bar (prevents keyboard focus loss on mobile)
// ──────────────────────────────────────────────

interface ChatInputBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder: string;
  poweredBy: string;
}

const ChatInputBar = memo(function ChatInputBar({
  inputRef,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  placeholder,
  poweredBy,
}: ChatInputBarProps) {
  return (
    <div
      className="border-t border-red-200/40 dark:border-red-800/40 p-3 bg-gradient-to-r from-red-50/60 to-blue-50/60 dark:from-red-950/40 dark:to-blue-950/40"
    >
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="text-sm border-red-300/60 dark:border-red-700/60 focus-visible:ring-red-500 bg-white dark:bg-background rounded-lg"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shrink-0 rounded-lg shadow-md shadow-red-600/20 transition-all"
        >
          <Send className="size-4" />
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">
        {poweredBy}
      </p>
    </div>
  );
});

// ──────────────────────────────────────────────
// Pulse Animation Keyframes
// ──────────────────────────────────────────────

const pulseKeyframes = [
  { scale: 1, boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
  { scale: 1.05, boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)' },
  { scale: 1, boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' },
];

// ──────────────────────────────────────────────
// Enhanced AI Chat Assistant Component
// ──────────────────────────────────────────────

export function AiChatAssistant() {
  const { t } = useLanguage();
  const [windowState, setWindowState] = useState<WindowState>('closed');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasError, setHasError] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevWindowStateRef = useRef<WindowState>('closed');

  // ── Dragging (enabled only in 'normal' state on desktop) ──
  const isDesktop = useRef(true);

  useEffect(() => {
    const checkDesktop = () => {
      isDesktop.current = window.innerWidth >= 1024;
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const draggable = useDraggable(
    windowState === 'normal' && isDesktop.current
  );

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

  // ── Track unread notifications ──
  useEffect(() => {
    const prevState = prevWindowStateRef.current;
    const prevCount = prevMessageCountRef.current;

    // If new assistant messages arrived while window is closed or minimized
    if (
      (prevState === 'closed' || prevState === 'minimized') &&
      messages.length > prevCount &&
      messages[messages.length - 1]?.role === 'assistant'
    ) {
      setHasUnread(true);
    }

    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // ── Clear unread when window is opened normally or fullscreen ──
  useEffect(() => {
    if (windowState === 'normal' || windowState === 'fullscreen') {
      setHasUnread(false);
    }
    prevWindowStateRef.current = windowState;
  }, [windowState]);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Focus input on open and after response received ──
  const prevLoadingRef = useRef(false);
  const prevWindowStateRef2 = useRef<WindowState>('closed');
  useEffect(() => {
    const isOpen = windowState === 'normal' || windowState === 'fullscreen';
    const justOpened = prevWindowStateRef2.current !== windowState && isOpen;
    const justFinishedLoading = prevLoadingRef.current && !isLoading;

    // Update refs after computing conditions
    prevWindowStateRef2.current = windowState;
    prevLoadingRef.current = isLoading;

    // Focus on open OR when response arrives (loading finishes)
    if (isOpen && (justOpened || justFinishedLoading)) {
      // Use double requestAnimationFrame for reliable focus on mobile
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });
    }
  }, [windowState, isLoading]);

  // ── Initialize greeting if no messages ──
  useEffect(() => {
    if (
      (windowState === 'normal' || windowState === 'fullscreen') &&
      messages.length === 0
    ) {
      const greeting: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: t('chat.greeting'),
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, [windowState, messages.length, t]);

  // ── ESC key closes the chat ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (windowState === 'fullscreen') {
          setWindowState('normal');
        } else if (windowState === 'normal' || windowState === 'minimized') {
          setWindowState('closed');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowState]);

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

      const response = await apiFetch('/api/chat', {
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
          } catch {
            /* ignore */
          }
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
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove error messages after the last user message
      setMessages(
        (prev) => prev.filter((m) => m.timestamp <= lastUserMsg.timestamp)
      );
      sendMessage(lastUserMsg.content);
    }
  };

  // ── Format timestamp ──
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Window state transitions ──
  const openNormal = () => setWindowState('normal');
  const minimize = () => setWindowState('minimized');
  const maximize = () => setWindowState('fullscreen');
  const restoreFromFullscreen = () => setWindowState('normal');
  const restoreFromMinimized = () => setWindowState('normal');
  const closeChat = () => setWindowState('closed');

  // ── Determine sizing classes based on window state ──
  const getSizeClasses = () => {
    if (windowState === 'fullscreen') {
      return 'w-[calc(100vw-16px)] h-[calc(100vh-16px)] sm:w-[calc(100vw-24px)] sm:h-[calc(100vh-24px)]';
    }
    if (windowState === 'minimized') {
      return 'w-[calc(100vw-32px)] sm:w-[320px] h-auto';
    }
    // Normal state - responsive sizing
    return 'w-[calc(100vw-32px)] sm:w-[60vw] md:w-[480px] lg:w-[400px] h-[70vh] lg:h-[600px]';
  };

  const getPositionClasses = () => {
    if (windowState === 'fullscreen') {
      return 'top-2 left-2 sm:top-3 sm:left-3';
    }
    if (windowState === 'minimized') {
      return 'bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6';
    }
    // Normal: positioned by drag on desktop, fixed bottom-right on mobile
    return '';
  };

  // ── Render Header ──
  const renderHeader = (compact: boolean = false) => (
    <div
      className={`bg-gradient-to-r from-red-600 via-red-700 to-blue-600 text-white rounded-t-2xl border-b border-red-500/30 select-none ${
        compact ? 'py-2 px-3' : 'p-4 pb-2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`shrink-0 rounded-full bg-white/20 flex items-center justify-center ${
              compact ? 'size-6' : 'size-8'
            }`}
          >
            <Bot className={`${compact ? 'size-3' : 'size-4'} text-white`} />
          </div>
          <div className="min-w-0">
            <h3
              className={`font-semibold truncate leading-tight ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              {t('chat.title')}
            </h3>
            {!compact && (
              <p className="text-xs text-red-200/80 truncate leading-tight">
                {t('chat.subtitle')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" data-no-drag>
          {/* Clear history - only in normal/fullscreen */}
          {!compact && messages.length > 2 && (
            <button
              type="button"
              className="inline-flex items-center justify-center size-7 rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors"
              onClick={handleClearHistory}
              aria-label="Clear history"
              title="Limpar histórico"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}

          {/* Minimize button - in normal state */}
          {windowState === 'normal' && (
            <button
              type="button"
              className="inline-flex items-center justify-center size-7 rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors"
              onClick={minimize}
              aria-label="Minimize"
            >
              <Minimize2 className="size-3.5" />
            </button>
          )}

          {/* Maximize button - in normal state */}
          {windowState === 'normal' && (
            <button
              type="button"
              className="inline-flex items-center justify-center size-7 rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors"
              onClick={maximize}
              aria-label="Maximize"
            >
              <Maximize2 className="size-3.5" />
            </button>
          )}

          {/* Restore from fullscreen - in fullscreen state */}
          {windowState === 'fullscreen' && (
            <button
              type="button"
              className="inline-flex items-center justify-center size-7 rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors"
              onClick={restoreFromFullscreen}
              aria-label="Restore"
            >
              <Minimize2 className="size-3.5" />
            </button>
          )}

          {/* Restore from minimized - in minimized state */}
          {windowState === 'minimized' && (
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors ${
                compact ? 'size-6' : 'size-7'
              }`}
              onClick={restoreFromMinimized}
              aria-label="Restore"
            >
              <ChevronUp className={`${compact ? 'size-3' : 'size-3.5'}`} />
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md text-red-200 hover:bg-red-800/50 hover:text-white transition-colors ${
              compact ? 'size-6' : 'size-7'
            }`}
            onClick={closeChat}
            aria-label={t('common.close')}
          >
            <X className={`${compact ? 'size-3' : 'size-3.5'}`} />
          </button>
        </div>
      </div>

      {/* ── Session memory indicator (only in expanded states) ── */}
      {!compact && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            className="bg-white/10 text-red-200 border-red-400/20 text-[10px] px-2 py-0.5"
          >
            <Globe className="size-2.5 mr-1" />
            {t('chat.dbConnected')}
          </Badge>
          {messages.length > 1 && (
            <Badge
              className="bg-white/10 text-red-200 border-red-400/20 text-[10px] px-2 py-0.5"
            >
              <Sparkles className="size-2.5 mr-1" />
              {messages.length - 1} {t('chat.messagesInMemory')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  // ── Render Messages Area ──
  const renderMessages = () => {
    // Dynamic height calculation based on window state
    const scrollHeight =
      windowState === 'fullscreen'
        ? 'h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)]'
        : 'h-[calc(70vh-180px)] lg:h-[420px]';

    return (
      <div
        className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/10"
      >
        <ScrollArea className={`${scrollHeight} px-4 py-3`}>
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
                  <div
                    className="shrink-0 size-7 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center shadow-sm"
                  >
                    <Bot
                      className="size-3.5 text-red-700 dark:text-red-400"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[80%] min-w-0 rounded-xl px-3 py-2.5 text-sm overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/20'
                      : 'bg-white dark:bg-red-950/50 text-foreground border border-red-200/60 dark:border-red-800/40 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.role === 'user'
                        ? 'text-red-200/60'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div
                    className="shrink-0 size-7 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md shadow-red-600/20"
                  >
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
                <div
                  className="shrink-0 size-7 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center"
                >
                  <Bot
                    className="size-3.5 text-red-700 dark:text-red-400"
                  />
                </div>
                <div
                  className="bg-white dark:bg-red-950/50 rounded-xl px-4 py-3 border border-red-200/60 dark:border-red-800/40 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="animate-bounce size-2 rounded-full bg-red-600 [animation-delay:0ms]"
                      />
                      <div
                        className="animate-bounce size-2 rounded-full bg-red-600 [animation-delay:150ms]"
                      />
                      <div
                        className="animate-bounce size-2 rounded-full bg-red-600 [animation-delay:300ms]"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t('chat.thinking')}
                    </span>
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
                <div
                  className="bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2 border border-red-200/60 dark:border-red-800/40"
                >
                  <p className="text-sm text-red-700 dark:text-red-400 mb-2 whitespace-pre-wrap break-words">
                    {t('chat.error')}
                  </p>
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
            <Separator
              className="mb-2 bg-red-200/40 dark:bg-red-800/40"
            />
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {t('chat.frequentQuestions')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="inline-flex items-center justify-center text-xs h-auto py-1.5 px-3 border border-red-300/60 dark:border-red-700/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg shadow-sm transition-all hover:shadow-md bg-white dark:bg-red-950/50"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render Input Area (memoized to prevent keyboard focus loss on mobile) ──

  return (
    <>
      {/* ── Floating Chat Bubble (closed state) ── */}
      <AnimatePresence>
        {windowState === 'closed' && (
          <motion.button
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={openNormal}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-colors group"
            aria-label={t('chat.open')}
            // Pulsing animation when idle (no unread)
            {...(!hasUnread
              ? {
                  animate: {
                    ...bubbleVariants.visible,
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(211, 47, 47, 0.4)',
                      '0 0 0 12px rgba(211, 47, 47, 0)',
                      '0 0 0 0 rgba(211, 47, 47, 0)',
                    ],
                  },
                  transition: {
                    scale: {
                      repeat: Infinity,
                      duration: 2.5,
                      ease: 'easeInOut',
                    },
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2.5,
                      ease: 'easeInOut',
                    },
                  },
                }
              : {})}
          >
            <MessageCircle
              className="size-6 group-hover:scale-110 transition-transform"
            />
            <Badge
              className="absolute -top-1 -right-1 size-5 p-0 bg-yellow-400 text-red-900 text-[10px] flex items-center justify-center border-0 rounded-full shadow-sm"
            >
              <Sparkles className="size-3" />
            </Badge>

            {/* ── Unread notification dot ── */}
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -left-1.5 size-4 rounded-full bg-red-500 border-2 border-white shadow-md"
              >
                <span className="sr-only">New messages</span>
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Minimized State: Mini-bar ── */}
      <AnimatePresence>
        {windowState === 'minimized' && (
          <motion.div
            variants={minimizedVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-50 ${getPositionClasses()} ${getSizeClasses()}`}
          >
            <div
              className="border border-red-200/60 dark:border-red-800/60 shadow-xl shadow-red-900/20 overflow-hidden rounded-xl bg-background"
            >
              {renderHeader(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Normal State: Floating draggable window ── */}
      <AnimatePresence>
        {windowState === 'normal' && (
          <motion.div
            ref={draggable.containerRef}
            variants={windowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              x: isDesktop.current ? draggable.motionX : 0,
              y: isDesktop.current ? draggable.motionY : 0,
            }}
            onPointerDown={draggable.onPointerDown}
            onPointerMove={draggable.onPointerMove}
            onPointerUp={draggable.onPointerUp}
            className={`fixed z-50 ${
              isDesktop.current ? '' : 'bottom-6 right-6'
            } ${getSizeClasses()}`}
          >
            <div
              className="border border-red-200/60 dark:border-red-800/60 shadow-2xl shadow-red-900/20 h-full flex flex-col overflow-hidden rounded-2xl bg-background"
            >
              {renderHeader(false)}
              {renderMessages()}
              <ChatInputBar
                inputRef={inputRef}
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder={t('chat.placeholder')}
                poweredBy={t('chat.poweredBy')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fullscreen State ── */}
      <AnimatePresence>
        {windowState === 'fullscreen' && (
          <motion.div
            variants={fullscreenVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-50 ${getPositionClasses()} ${getSizeClasses()}`}
          >
            <div
              className="border border-red-200/60 dark:border-red-800/60 shadow-2xl shadow-red-900/20 h-full flex flex-col overflow-hidden rounded-2xl bg-background"
            >
              {renderHeader(false)}
              {renderMessages()}
              <ChatInputBar
                inputRef={inputRef}
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder={t('chat.placeholder')}
                poweredBy={t('chat.poweredBy')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
