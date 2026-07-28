'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  MessageCircle,
  ThumbsUp,
  Pin,
  Lock,
  CheckCircle2,
  Plus,
  MessagesSquare,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithFallback, fetchForumClient } from '@/lib/client-firestore';

const TechPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.TechPatternSVG),
  { ssr: false }
);

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

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
  createdAt: string;
  topics: ForumTopicData[];
  _count: {
    topics: number;
  };
}

// ──────────────────────────────────────────────
// Animation Variants
// ──────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function ForumPage() {
  const { t, formatRelativeTime } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<ForumCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false);

  // Fetch forum data, with client-side Firestore fallback
  useEffect(() => {
    async function fetchForum() {
      try {
        setLoading(true);
        const result = await fetchWithFallback('/api/forum', fetchForumClient);
        setCategories(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchForum();
  }, []);

  // Flatten all topics across categories
  const allTopics = useMemo(() => {
    const topics: ForumTopicData[] = [];
    categories.forEach((cat) => topics.push(...cat.topics));
    return topics;
  }, [categories]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    let result = allTopics;
    if (selectedCategory) {
      result = result.filter((topic) => topic.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (topic) =>
          topic.title.toLowerCase().includes(q) ||
          (topic.content && topic.content.toLowerCase().includes(q))
      );
    }
    // Sort: pinned first, then by date
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allTopics, selectedCategory, searchQuery]);

  // Navigate to topic detail
  const handleViewTopic = (slug: string) => {
    router.push(`/forum/${slug}`);
  };

  // Category color mapping
  const getCategoryColor = (slug: string) => {
    switch (slug) {
      case 'discussao-general':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '💬' };
      case 'ajuda-suporte':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🔧' };
      case 'projectos-portfolio':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎨' };
      case 'emprego-freelance':
        return { bg: 'bg-sky-100', text: 'text-sky-700', icon: '💼' };
      default:
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '💬' };
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <TechPatternSVG className="bottom-[5%] left-[2%] w-[200px] h-[200px]" opacity={0.03} />
      </Suspense>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 md:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t('forum.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('forum.description')}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full sm:max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('forum.searchTopics') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {isAuthenticated && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                size="sm"
                onClick={() => setShowNewTopicDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('forum.createTopic')}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Category cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {categories.map((cat) => {
            const color = getCategoryColor(cat.slug);
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.div key={cat.id} variants={itemVariants}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-emerald-500 shadow-md' : ''
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? null : cat.id
                    )
                  }
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-10 h-10 mx-auto rounded-full ${color.bg} flex items-center justify-center mb-2`}
                    >
                      <span className="text-lg">{color.icon}</span>
                    </div>
                    <h3 className={`font-semibold text-sm ${color.text}`}>
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        <MessageCircle className="w-2.5 h-2.5 mr-0.5" />
                        {cat._count.topics}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Category filter tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'hover:bg-emerald-50 text-foreground'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            {t('blog.categoryAll')}
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'hover:bg-emerald-50 text-foreground'
              }`}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )
              }
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <MessagesSquare className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t('common.retry')}
            </Button>
          </motion.div>
        )}

        {/* No topics */}
        {!loading && !error && filteredTopics.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <MessagesSquare className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-muted-foreground">{t('forum.noTopics')}</p>
          </motion.div>
        )}

        {/* Topic list table */}
        {!loading && !error && filteredTopics.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile-friendly topic cards */}
            <div className="space-y-3 md:hidden">
              {filteredTopics.map((topic) => (
                <motion.div key={topic.id} variants={itemVariants}>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewTopic(topic.slug)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {topic.isPinned && (
                              <Badge className="bg-amber-500 text-white text-xs border-amber-400">
                                <Pin className="w-2.5 h-2.5 mr-0.5" />
                                {t('forum.pinned')}
                              </Badge>
                            )}
                            {topic.isLocked && (
                              <Badge className="bg-red-500 text-white text-xs border-red-400">
                                <Lock className="w-2.5 h-2.5 mr-0.5" />
                                {t('forum.locked')}
                              </Badge>
                            )}
                            {topic.isResolved && (
                              <Badge className="bg-emerald-500 text-white text-xs border-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                {t('forum.resolved')}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                            {topic.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {topic.author.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {topic._count.replies}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {topic._count.likes}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Desktop table view */}
            <Card className="hidden md:block overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50">
                    <TableHead className="w-[50%]">{t('forum.topics')}</TableHead>
                    <TableHead>{t('forum.topicAuthor')}</TableHead>
                    <TableHead className="text-center">{t('forum.replies')}</TableHead>
                    <TableHead className="text-center">{t('blog.likes')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map((topic) => (
                    <TableRow
                      key={topic.id}
                      className="cursor-pointer hover:bg-emerald-50/30 transition-colors"
                      onClick={() => handleViewTopic(topic.slug)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {topic.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="font-medium text-foreground line-clamp-1">
                            {topic.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {topic.author.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {topic._count.replies}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {topic._count.likes}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {topic.isPinned && (
                            <Badge className="bg-amber-500 text-white text-xs border-amber-400">
                              <Pin className="w-2.5 h-2.5 mr-0.5" />
                              {t('forum.pinned')}
                            </Badge>
                          )}
                          {topic.isLocked && (
                            <Badge className="bg-red-500 text-white text-xs border-red-400">
                              <Lock className="w-2.5 h-2.5 mr-0.5" />
                              {t('forum.locked')}
                            </Badge>
                          )}
                          {topic.isResolved && (
                            <Badge className="bg-emerald-500 text-white text-xs border-emerald-400">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                              {t('forum.resolved')}
                            </Badge>
                          )}
                          {!topic.isPinned && !topic.isLocked && !topic.isResolved && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {t('forum.unresolved')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}

        {/* Forum stats / info section */}
        {!loading && !error && categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="mt-10"
          >
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forum statistics */}
              <Card className="border-emerald-200/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessagesSquare className="w-4 h-4 text-emerald-600" />
                    {t('common.overview')}
                  </h3>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">
                        {allTopics.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('forum.topics')}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">
                        {allTopics.reduce((sum, t) => sum + t._count.replies, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('forum.replies')}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">
                        {categories.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('forum.categories')}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">
                        {allTopics.filter((t) => t.isResolved).length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('forum.resolved')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forum rules / info */}
              <Card className="border-emerald-200/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t('forum.rules')}
                  </h3>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Respeite todos os membros da comunidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Partilhe conhecimento e experiências relevantes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Não publique conteúdo spam ou ofensivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Marque tópicos como resolvidos quando encontrar a solução</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
