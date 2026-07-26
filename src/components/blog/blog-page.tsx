'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  User,
  Tag,
  ArrowRight,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';

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

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  published: boolean;
  authorId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  category: PostCategory | null;
  tags: PostTag[];
}

// ──────────────────────────────────────────────
// Animation Variants
// ──────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function BlogPage() {
  const { t, formatDate } = useLanguage();
  const router = useRouter();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch posts from API
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const res = await fetch('/api/posts');
        const json = await res.json();
        if (json.success) {
          setPosts(json.data);
        } else {
          setError(json.message || 'Failed to fetch posts');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Extract unique categories from posts
  const categories = useMemo(() => {
    const cats = posts
      .map((p) => p.category)
      .filter(Boolean) as PostCategory[];
    const unique = new Map<string, PostCategory>();
    cats.forEach((c) => unique.set(c.id, c));
    return Array.from(unique.values());
  }, [posts]);

  // Extract all unique tags from posts
  const allTags = useMemo(() => {
    const tagMap = new Map<string, PostTag>();
    posts.forEach((p) =>
      p.tags.forEach((tag) => tagMap.set(tag.id, tag))
    );
    return Array.from(tagMap.values());
  }, [posts]);

  // Filter posts by search and category
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (selectedCategory) {
      result = result.filter((p) => p.category?.id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          p.tags.some((tag) => tag.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, selectedCategory, searchQuery]);

  // Featured post is the first one
  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  // Navigate to a post detail
  const handleViewPost = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  // Calculate estimated read time
  const getReadTime = (content: string | null): string => {
    if (!content) return '2 min';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 md:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t('blog.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('blog.description')}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Category filter tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
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
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
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
              <TrendingUp className="w-8 h-8 text-red-500" />
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

        {/* No posts */}
        {!loading && !error && filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-muted-foreground">{t('blog.noPosts')}</p>
          </motion.div>
        )}

        {/* Featured post hero */}
        {!loading && !error && featuredPost && (
          <AnimatePresence>
            <motion.div
              key={featuredPost.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Card
                className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow border-emerald-200/50"
                onClick={() => handleViewPost(featuredPost.slug)}
              >
                <div className="relative h-48 md:h-64 bg-gradient-to-br from-emerald-600 to-emerald-800 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/placeholder-blog.jpg')] bg-cover bg-center opacity-30" />
                  <div className="absolute inset-0 flex items-end p-6 md:p-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {featuredPost.category && (
                          <Badge className="bg-emerald-500 text-white border-emerald-400">
                            {featuredPost.category.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-white/40 text-white bg-white/10">
                          <Clock className="w-3 h-3 mr-1" />
                          {getReadTime(featuredPost.content)}
                        </Badge>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2 group-hover:underline decoration-white/50">
                        {featuredPost.title}
                      </h2>
                      <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {featuredPost.author.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(featuredPost.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Grid of post cards */}
        {!loading && !error && gridPosts.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {gridPosts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <Card
                  className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-1 h-full"
                  onClick={() => handleViewPost(post.slug)}
                >
                  {/* Featured image placeholder */}
                  <div className="relative h-40 bg-gradient-to-br from-emerald-100 to-emerald-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-emerald-400" />
                    </div>
                    {post.category && (
                      <Badge className="absolute top-3 left-3 bg-emerald-600 text-white border-emerald-500">
                        {post.category.name}
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2 pt-4 px-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {post.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt || ''}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700"
                          >
                            <Tag className="w-2.5 h-2.5 mr-0.5" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="px-4 pb-4 pt-2">
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Sidebar (mobile: below grid, desktop: could be integrated as filter bar) */}
        {!loading && !error && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="mt-10"
          >
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Popular tags */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  {t('blog.tags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-emerald-50 border-emerald-200 text-emerald-700 transition-colors"
                      onClick={() => setSearchQuery(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recent posts quick links */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {t('blog.recentPosts')}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {posts.slice(0, 5).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleViewPost(post.slug)}
                    >
                      <ChevronDown className="w-3 h-3 text-emerald-500 rotate-[-90deg]" />
                      <span className="text-sm text-muted-foreground group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {post.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  {t('blog.categories')}
                </h3>
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                    onClick={() => setSelectedCategory(null)}
                  >
                    <span className="text-sm text-foreground group-hover:text-emerald-700">
                      {t('blog.categoryAll')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {posts.length}
                    </Badge>
                  </div>
                  {categories.map((cat) => {
                    const count = posts.filter(
                      (p) => p.category?.id === cat.id
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <span className="text-sm text-foreground group-hover:text-emerald-700">
                          {cat.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
