'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Briefcase,
  FolderKanban,
  FileText,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { fetchWithFallback, fetchPostsClient, fetchForumClient } from '@/lib/client-firestore';
import { apiFetch, safeJson } from '@/lib/api-fetch';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'service' | 'project' | 'blog' | 'forum';
  view: string;
  slug?: string;
}

// ──────────────────────────────────────────────
// Global Search Component
// ──────────────────────────────────────────────

export function GlobalSearch() {
  const { t } = useLanguage();
  const { searchOpen, setSearchOpen } = useAppStore();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Keyboard shortcut (Ctrl+K / Cmd+K) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // ── Reset query on open/close ──
  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      setResults([]);
    }
  }, [searchOpen]);

  // ── Fetch results from all endpoints ──
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const lowerQuery = searchQuery.toLowerCase();

      // Fetch from multiple endpoints simultaneously
      // Use fetchWithFallback for blog/forum to handle static export
      const [servicesRes, projectsRes, postsResult, forumResult] = await Promise.allSettled([
        apiFetch('/api/services').then((res) => safeJson(res)).catch(() => null),
        apiFetch('/api/projects').then((res) => safeJson(res)).catch(() => null),
        fetchWithFallback('/api/posts', fetchPostsClient).then(r => r.data).catch(() => []),
        fetchWithFallback('/api/forum', fetchForumClient).then(r => r.data).catch(() => []),
      ]);

      const allResults: SearchResult[] = [];

      // Process services
      if (servicesRes.status === 'fulfilled' && servicesRes.value) {
        try {
          const servicesData = servicesRes.value;
          if (servicesData.success && servicesData.data) {
            servicesData.data
              .filter((s: Record<string, unknown>) => {
                const name = String(s.name || '');
                const desc = String(s.description || '');
                return name.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery);
              })
              .forEach((s: Record<string, unknown>) => {
                allResults.push({
                  id: `service-${s.id}`,
                  title: String(s.name || ''),
                  description: String(s.description || '').slice(0, 120),
                  type: 'service',
                  view: 'services',
                });
              });
          }
        } catch { /* skip */ }
      }

      // Process projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value) {
        try {
          const projectsData = projectsRes.value;
          if (projectsData.success && projectsData.data) {
            projectsData.data
              .filter((p: Record<string, unknown>) => {
                const name = String(p.name || p.title || '');
                const desc = String(p.description || '');
                return name.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery);
              })
              .forEach((p: Record<string, unknown>) => {
                allResults.push({
                  id: `project-${p.id}`,
                  title: String(p.name || p.title || ''),
                  description: String(p.description || '').slice(0, 120),
                  type: 'project',
                  view: 'projects',
                });
              });
          }
        } catch { /* skip */ }
      }

      // Process posts (blog)
      if (postsResult.status === 'fulfilled' && Array.isArray(postsResult.value)) {
        try {
          const postsData = postsResult.value as any[];
          postsData
            .filter((p: any) => {
              const title = String(p.title || '');
              const excerpt = String(p.excerpt || '');
              return title.toLowerCase().includes(lowerQuery) || excerpt.toLowerCase().includes(lowerQuery);
            })
            .forEach((p: any) => {
              allResults.push({
                id: `post-${p.id}`,
                title: String(p.title || ''),
                description: String(p.excerpt || '').slice(0, 120),
                type: 'blog',
                view: 'blogPost',
                slug: String(p.slug || ''),
              });
            });
        } catch { /* skip */ }
      }

      // Process forum topics
      if (forumResult.status === 'fulfilled' && Array.isArray(forumResult.value)) {
        try {
          const forumData = forumResult.value as any[];
          // Forum data is nested in categories
          forumData.forEach((cat: any) => {
            const topics = Array.isArray(cat.topics) ? cat.topics : [];
            topics
              .filter((topic: any) => {
                const title = String(topic.title || '');
                return title.toLowerCase().includes(lowerQuery);
              })
              .forEach((topic: any) => {
                allResults.push({
                  id: `forum-${topic.id}`,
                  title: String(topic.title || ''),
                  description: String(topic.content || '').slice(0, 120),
                  type: 'forum',
                  view: 'forumTopic',
                  slug: String(topic.slug || ''),
                });
              });
          });
        } catch { /* skip */ }
      }

      setResults(allResults.slice(0, 20)); // limit to 20 total results
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  // ── Handle result selection ──
  const handleSelect = (result: SearchResult) => {
    setSearchOpen(false);

    if (result.type === 'blog' && result.slug) {
      router.push(`/blog/${result.slug}`);
    } else if (result.type === 'forum' && result.slug) {
      router.push(`/forum/${result.slug}`);
    } else {
      router.push(`/${result.view}`);
    }
  };

  // ── Group results by type ──
  const services = results.filter((r) => r.type === 'service');
  const projects = results.filter((r) => r.type === 'project');
  const blogPosts = results.filter((r) => r.type === 'blog');
  const forumTopics = results.filter((r) => r.type === 'forum');

  const typeIcon = {
    service: Briefcase,
    project: FolderKanban,
    blog: FileText,
    forum: MessageSquare,
  };

  const typeColor = {
    service: 'text-emerald-600',
    project: 'text-teal-600',
    blog: 'text-green-600',
    forum: 'text-lime-600',
  };

  const hasAnyResults = results.length > 0;

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title={t('search.title')}
      description={t('search.placeholder')}
      className="[&_[cmdk-group-heading]]:text-emerald-700 [&_[cmdk-item]]:aria-selected:bg-emerald-50 [&_[cmdk-item]]:aria-selected:text-emerald-900 dark:[&_[cmdk-group-heading]]:text-emerald-400 dark:[&_[cmdk-item]]:aria-selected:bg-emerald-950 dark:[&_[cmdk-item]]:aria-selected:text-emerald-100"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('search.placeholder')}
      />

      <CommandList>
        {!loading && !query && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t('search.placeholder')}
              </p>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {t('search.shortcut')}
              </Badge>
            </div>
          </CommandEmpty>
        )}

        {loading && (
          <CommandEmpty>
            <div className="flex items-center gap-2 py-4">
              <div className="animate-spin size-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
            </div>
          </CommandEmpty>
        )}

        {!loading && query && !hasAnyResults && (
          <CommandEmpty>{t('search.noResults')}</CommandEmpty>
        )}

        {services.length > 0 && (
          <CommandGroup heading={t('search.services')}>
            {services.map((result) => {
              const Icon = typeIcon[result.type];
              return (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <Icon className={`size-4 ${typeColor[result.type]}`} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {result.description}
                    </span>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground ml-auto" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {projects.length > 0 && (
          <>
            {services.length > 0 && <CommandSeparator />}
            <CommandGroup heading={t('search.projects')}>
              {projects.map((result) => {
                const Icon = typeIcon[result.type];
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <Icon className={`size-4 ${typeColor[result.type]}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </span>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground ml-auto" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {blogPosts.length > 0 && (
          <>
            {(services.length > 0 || projects.length > 0) && <CommandSeparator />}
            <CommandGroup heading={t('search.blog')}>
              {blogPosts.map((result) => {
                const Icon = typeIcon[result.type];
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <Icon className={`size-4 ${typeColor[result.type]}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </span>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground ml-auto" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {forumTopics.length > 0 && (
          <>
            {(services.length > 0 || projects.length > 0 || blogPosts.length > 0) && <CommandSeparator />}
            <CommandGroup heading={t('search.forum')}>
              {forumTopics.map((result) => {
                const Icon = typeIcon[result.type];
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <Icon className={`size-4 ${typeColor[result.type]}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </span>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground ml-auto" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
