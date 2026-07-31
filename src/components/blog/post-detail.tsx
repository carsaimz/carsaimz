'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Tag,
  Share2,
  Heart,
  MessageCircle,
  Send,
  BookOpen,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { fetchWithFallback, fetchPostsClient } from '@/lib/client-firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PostAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface PostCategory {
  id: string;
  name: string;
  slug: string;
}

interface PostTag {
  id: string;
  name: string;
  slug: string;
}

interface CommentData {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: PostAuthor;
  isApproved: boolean;
  createdAt: string;
}

interface PostData {
  id: string;
  title: string;
  titleI18n: string | null;
  slug: string;
  excerpt: string | null;
  excerptI18n: string | null;
  content: string | null;
  contentI18n: string | null;
  featuredImage: string | null;
  published: boolean;
  authorId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  category: PostCategory | null;
  tags: PostTag[];
  comments?: CommentData[]; // Optional since API may not include comments
}

// ──────────────────────────────────────────────
// Animation Variants
// ──────────────────────────────────────────────

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function PostDetail({ slug: propSlug }: { slug?: string }) {
  const { t, language, formatDate, formatRelativeTime } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [post, setPost] = useState<PostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Fetch all posts and find the selected one
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const result = await fetchWithFallback('/api/posts', fetchPostsClient);
        const allPosts: PostData[] = result.data;
        const found = allPosts.find((p: PostData) => p.slug === propSlug);
        if (found) {
          // Ensure comments array exists (API may not include it)
          (found as any).comments = (found as any).comments || [];
          setPost(found);
          // Related posts: same category or similar tags
          const related = allPosts
            .filter(
              (p: PostData) =>
                p.id !== found.id &&
                (p.category?.id === found.category?.id ||
                  p.tags.some((tag) => found.tags.some((ft) => ft.id === tag.id)))
            )
            .slice(0, 3);
          setRelatedPosts(related);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }
    if (propSlug) {
      fetchPosts();
    }
  }, [propSlug]);

  // Navigate back to blog
  const handleBack = () => {
    router.push('/blog');
  };

  // Navigate to related post
  const handleViewPost = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post || !user) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: commentText.trim(),
          authorId: user.id,
        }),
      });
      const data = await safeJson(res);
      if (data?.success) {
        const newComment: CommentData = {
          id: data.data.id || `comment-${Date.now()}`,
          content: commentText,
          postId: post.id,
          authorId: user.id,
          author: {
            id: user.id,
            name: user.name,
            email: user.email || '',
            avatar: user.avatar,
          },
          isApproved: true,
          createdAt: new Date().toISOString(),
        };
        setPost({ ...post, comments: [...(post.comments || []), newComment] });
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Share functionality
  const handleShare = (platform: string) => {
    if (!post) return;
    const url = `${window.location.origin}/blog/${post.slug}`;
    const text = resolveI18nContent(post.titleI18n, post.title, language);
    switch (platform) {
      case 'facebook':
        window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
    setShareOpen(false);
  };

  // Calculate read time
  const getReadTime = (content: string | null): string => {
    if (!content) return '2 min';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min`;
  };

  // Render markdown-like content
  const renderContent = (content: string | null) => {
    if (!content) return <p className="text-muted-foreground">{t('common.noResults')}</p>;

    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Empty line = paragraph break
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Regular paragraph
      return (
        <p key={i} className="text-muted-foreground leading-relaxed mb-1">
          {line}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-6 rounded-xl" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !post) {
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
          <span className="text-sm text-muted-foreground">{t('blog.title')}</span>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Hero image area */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="relative h-48 md:h-64 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white/20" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/40 to-transparent">
            {post.category && (
              <Badge className="bg-emerald-500 text-white border-emerald-400 mb-2">
                {post.category.name}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {getReadTime(resolveI18nContent(post.contentI18n, post.content || '', language))}
            </div>
          </div>
        </motion.div>

        {/* Post title and meta */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {resolveI18nContent(post.titleI18n, post.title, language)}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                  {post.author.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
                {post.author.avatar && <AvatarImage src={post.author.avatar} />}
              </Avatar>
              <span className="font-medium text-foreground">{post.author.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {getReadTime(resolveI18nContent(post.contentI18n, post.content || '', language))}
            </span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                >
                  <Tag className="w-2.5 h-2.5 mr-0.5" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="mb-6" />
        </motion.div>

        {/* Post content */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {renderContent(resolveI18nContent(post.contentI18n, post.content || '', language))}
        </motion.div>

        {/* Action bar: like & share */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant={liked ? 'default' : 'outline'}
            size="sm"
            className={`${
              liked
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
            }`}
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
            {t('blog.likes')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={() => setShareOpen(!shareOpen)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              {t('blog.shareArticle')}
            </Button>

            <AnimatePresence>
              {shareOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-muted-foreground hover:text-blue-600"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-muted-foreground hover:text-sky-500"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="text-muted-foreground hover:text-blue-700"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="text-muted-foreground hover:text-emerald-600 dark:text-emerald-400"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Author info sidebar */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <Card className="border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-emerald-200 text-emerald-800 font-bold">
                  {post.author.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
                {post.author.avatar && <AvatarImage src={post.author.avatar} />}
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                <p className="text-sm text-muted-foreground">{post.author.email}</p>
                <Badge
                  variant="outline"
                  className="mt-1 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs"
                >
                  {t('blog.author')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments section */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t('blog.comments')} ({post.comments?.length ?? 0})
          </h2>

          {/* Comments list */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {(post.comments?.length ?? 0) === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t('common.noResults')}
              </p>
            )}
            {(post.comments || []).map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                    {comment.author.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                  {comment.author.avatar && <AvatarImage src={comment.author.avatar} />}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add comment form */}
          {isAuthenticated ? (
            <Card className="border-emerald-200/50 dark:border-emerald-800/30">
              <CardContent className="p-4">
                <Textarea
                  placeholder={t('blog.commentPlaceholder')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] mb-3 resize-none"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
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
                      {t('blog.submitComment')}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4 border rounded-lg border-border">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')} — {t('auth.login')} {t('common.to')} {t('blog.comments')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <Separator className="mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {t('blog.relatedPosts')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Card
                  key={rp.id}
                  className="cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
                  onClick={() => handleViewPost(rp.slug)}
                >
                  <div className="h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <CardHeader className="pb-2 pt-3 px-3">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 dark:hover:text-emerald-300 transition-colors">
                      {rp.title}
                    </h3>
                  </CardHeader>
                  <CardFooter className="px-3 pb-3 pt-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {rp.author.name}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
