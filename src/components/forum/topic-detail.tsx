'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Pin,
  Lock,
  CheckCircle2,
  ThumbsUp,
  Send,
  MessagesSquare,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ReplyAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface ForumReply {
  id: string;
  content: string;
  topicId: string;
  authorId: string;
  createdAt: string;
  author: ReplyAuthor;
}

interface TopicAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface ForumTopicData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  categoryId: string;
  authorId: string;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: TopicAuthor;
  replies?: ForumReply[]; // Optional since API may not include them
  _count: {
    replies: number;
    likes: number;
  };
}

interface ForumCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  topics: ForumTopicData[];
  _count: {
    topics: number;
  };
}

// ──────────────────────────────────────────────
// Animation Variants
// ──────────────────────────────────────────────

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const replyVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function TopicDetail({ slug: propSlug }: { slug?: string }) {
  const { t, formatDate, formatRelativeTime } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();

  // Use prop slug if provided, otherwise get from URL params
  const slug = propSlug || (params?.slug as string);

  const [topic, setTopic] = useState<ForumTopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Fetch topic data using the direct topic API endpoint
  useEffect(() => {
    async function fetchTopic() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/forum?topic=${encodeURIComponent(slug)}`);
        const result = await safeJson(res);
        if (result && result.success && result.data) {
          setTopic(result.data);
          setLikeCount(result.data._count?.likes || 0);
        } else {
          setError(result?.message || 'Topic not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }
    if (slug && slug !== '__dynamic__') {
      fetchTopic();
    }
  }, [slug]);

  // Navigate back to forum
  const handleBack = () => {
    router.push('/forum');
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !topic || !user) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          content: replyText.trim(),
          authorId: user.id,
        }),
      });
      const data = await safeJson(res);
      if (data?.success) {
        const newReply: ForumReply = {
          id: data.data.id || `reply-${Date.now()}`,
          content: replyText,
          topicId: topic.id,
          authorId: user.id,
          createdAt: new Date().toISOString(),
          author: {
            id: user.id,
            name: user.name,
            email: user.email || '',
            avatar: user.avatar,
          },
        };
        setTopic({
          ...topic,
          replies: [...(topic.replies || []), newReply],
          _count: { ...topic._count, replies: topic._count.replies + 1 },
        });
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle like
  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-8" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || t('common.noResults')}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nav.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 md:px-8 py-3"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('nav.back')}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{t('forum.title')}</span>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Topic title and status badges */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {topic.isPinned && (
              <Badge className="bg-amber-500 text-white border-amber-400">
                <Pin className="w-3 h-3 mr-1" />
                {t('forum.pinned')}
              </Badge>
            )}
            {topic.isLocked && (
              <Badge className="bg-red-500 text-white border-red-400">
                <Lock className="w-3 h-3 mr-1" />
                {t('forum.locked')}
              </Badge>
            )}
            {topic.isResolved && (
              <Badge className="bg-emerald-500 text-white border-emerald-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t('forum.resolved')}
              </Badge>
            )}
            {!topic.isResolved && !topic.isLocked && (
              <Badge variant="outline" className="text-muted-foreground">
                {t('forum.unresolved')}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {topic.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                  {topic.author.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
                {topic.author.avatar && <AvatarImage src={topic.author.avatar} />}
              </Avatar>
              <span className="font-medium text-foreground">{topic.author.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(topic.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <MessagesSquare className="w-3.5 h-3.5" />
              {topic._count.replies} {t('forum.replies')}
            </span>
          </div>

          <Separator className="mb-6" />
        </motion.div>

        {/* Topic content */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/20 dark:bg-emerald-950/20">
            <CardContent className="p-4 md:p-6">
              {topic.content ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-headings:text-foreground prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-code:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground">{t('common.noResults')}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Like button */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant={liked ? 'default' : 'outline'}
              size="sm"
              className={`${
                liked
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
              onClick={handleLike}
            >
              <ThumbsUp className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {likeCount} {t('blog.likes')}
            </Button>

            {isAuthenticated && !topic.isResolved && (
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t('forum.markResolved')}
              </Button>
            )}
          </div>
        </motion.div>

        <Separator className="mb-6" />

        {/* Reply list */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t('forum.replies')} ({topic.replies?.length ?? topic._count?.replies ?? 0})
          </h2>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {(topic.replies?.length ?? 0) === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t('common.noResults')}
              </p>
            )}
            <AnimatePresence>
              {(topic.replies || []).map((reply, i) => (
                <motion.div
                  key={reply.id}
                  variants={replyVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50 hover:border-emerald-200/50 dark:border-emerald-800/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
                            {reply.author.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                          {reply.author.avatar && (
                            <AvatarImage src={reply.author.avatar} />
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm text-foreground">
                              {reply.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(reply.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Add reply form */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          {topic.isLocked ? (
            <Card className="border-red-200 bg-red-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">
                    {t('forum.locked')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('forum.lockedMessage')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isAuthenticated ? (
            <Card className="border-emerald-200/50 dark:border-emerald-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                      {user?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-foreground">
                    {user?.name}
                  </span>
                </div>
                <Textarea
                  placeholder={t('forum.replyTopic') + '...'}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] mb-3 resize-none"
                />
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || submitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">...</span>
                      {t('common.loading')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {t('forum.replyTopic')}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('auth.noAccount')} — {t('auth.login')} {t('common.to')} {t('forum.replyTopic')}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
