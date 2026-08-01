'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { stripHtml } from '@/lib/utils';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useRouter } from 'next/navigation';

interface PostData {
  id: string;
  slug: string;
  title: string;
  titleI18n: string | null;
  excerpt: string | null;
  excerptI18n: string | null;
  content: string | null;
  contentI18n: string | null;
  category: string | null;
  tags: string | null;
  coverImage: string | null;
  authorName: string | null;
  createdAt: string | null;
  readingTime: number | null;
  isFeatured: boolean;
  isPublished: boolean;
}

interface BlogPreviewSectionProps {
  maxItems?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function BlogPreviewSection({ maxItems = 8 }: BlogPreviewSectionProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/posts')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data?.length > 0) {
          setPosts(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="blog-preview" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render section if no posts
  if (posts.length === 0) return null;

  const displayPosts = posts.slice(0, maxItems);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section id="blog-preview" className="relative py-16 sm:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('blog.title') || 'Blog'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('blog.subtitle') || t('home.blogSubtitle') || 'Últimas publicações e insights'}
          </p>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {displayPosts.map((post) => {
            const resolvedTitle = resolveI18nContent(post.titleI18n, post.title, language);
            const resolvedExcerpt = resolveI18nContent(
              post.excerptI18n,
              post.excerpt || post.content || '',
              language
            );
            const plainExcerpt = stripHtml(resolvedExcerpt);
            const postTags = post.tags ? post.tags.split(',').map((tag: string) => tag.trim()).slice(0, 2) : [];

            return (
              <motion.div key={post.id} variants={cardVariants}>
                <Card
                  className="group hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 h-full cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/blog/${post.slug}`)}
                >
                  {/* Cover Image */}
                  {post.coverImage && (
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={resolvedTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {post.isFeatured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 border-0 text-xs font-semibold">
                          ★ Featured
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-snug line-clamp-2">
                      {resolvedTitle}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {post.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      )}
                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 [overflow-wrap:break-word] [word-break:break-word]">
                      {plainExcerpt}
                    </p>
                    {postTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {postTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                          >
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/blog/${post.slug}`);
                      }}
                    >
                      {t('common.readMore') || 'Ler Mais'}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button */}
        {posts.length > maxItems && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={() => router.push('/blog')}
            >
              {t('common.viewMore') || 'Ver Mais'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
