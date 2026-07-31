'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Filter,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useRouter } from 'next/navigation';
import { useDocumentTitle } from '@/hooks/use-document-title';

const ParticleNetwork = dynamic(
  () => import('@/components/common/3d-elements').then((mod) => mod.ParticleNetwork),
  { ssr: false }
);

interface ProjectData {
  id: string;
  slug: string;
  title: string;
  titleI18n: string | null;
  description: string | null;
  descriptionI18n: string | null;
  client: string | null;
  technologies: string | string[] | null;
  demoUrl: string | null;
  images: string | null;
  isFeatured: boolean;
  isPublished: boolean;
}

/**
 * Extract the first image from the images field.
 * The images field can be a single base64 string, a JSON array, or null.
 */
function getCoverImage(images: string | null): string | null {
  if (!images) return null;
  // If it's a base64 data URI, return as-is
  if (images.startsWith('data:')) return images;
  // If it's a JSON array, parse and return the first element
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not JSON, return as-is
  }
  return null;
}

// No fallback data - all data comes from the database via API

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const colorPalettes = [
  'from-emerald-500 to-teal-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-600 to-green-700',
  'from-teal-600 to-emerald-700',
];

export function ProjectsSection() {
  const { t, language } = useLanguage();
  useDocumentTitle('nav.projects', 'Projectos');
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiFetch('/api/projects')
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success) {
          setProjects(data.data || []);
        } else {
          setError(data?.message || 'Failed to load projects');
        }
      })
      .catch(() => {
        setError('Network error');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects =
    filter === 'all'
      ? projects
      : filter === 'featured'
        ? projects.filter((p) => p.isFeatured)
        : projects.filter((p) => p.client?.toLowerCase().includes(filter));

  const uniqueClients = Array.from(
    new Set(projects.map((p) => p.client || 'Unknown'))
  );

  if (loading) {
    return (
      <section id="projects" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="relative py-16 sm:py-24 bg-muted/30 overflow-hidden">
      {/* Decorative background */}
      <Suspense fallback={null}>
        <ParticleNetwork className="bottom-[10%] left-[5%] w-[300px] h-[300px]" particleCount={15} color="#10b981" />
      </Suspense>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('projects.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('projects.description')}
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8 justify-center"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('projects.filterByCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('projects.allCategories')}</SelectItem>
              <SelectItem value="featured">{t('common.featured')}</SelectItem>
              {uniqueClients.map((client) => (
                <SelectItem key={client} value={client.toLowerCase()}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project, index) => {
            const gradient = colorPalettes[index % colorPalettes.length];
            const techs = project.technologies
              ? (Array.isArray(project.technologies)
                  ? project.technologies
                  : project.technologies.split(',').map((t: string) => t.trim()))
              : [];
            const resolvedTitle = resolveI18nContent(project.titleI18n, project.title, language);
            const resolvedDescription = resolveI18nContent(project.descriptionI18n, project.description || '', language);

            return (
              <motion.div key={project.id} variants={cardVariants}>
                <Card
                  className="group hover:shadow-lg transition-all duration-300 h-full overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/projects/${project.slug}`)}
                >
                  {/* Image / placeholder */}
                  {getCoverImage(project.images) ? (
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={getCoverImage(project.images)!}
                        alt={resolvedTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {project.isFeatured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 border-0 text-xs font-semibold">
                          ★ Featured
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
                    >
                      <FolderOpen className="h-12 w-12 text-white/80" />
                      {project.isFeatured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 border-0 text-xs font-semibold">
                          ★ Featured
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-snug">
                      {resolvedTitle}
                    </CardTitle>
                    {project.client && (
                      <p className="text-sm text-muted-foreground">
                        {t('projects.client')}: {project.client}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pb-3">
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
                      {resolvedDescription}
                    </p>
                    {techs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {techs.slice(0, 4).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {techs.length > 4 && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            +{techs.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0">
                    {project.demoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.demoUrl!, '_blank');
                        }}
                      >
                        <ExternalLink className="mr-1 h-4 w-4" />
                        {t('projects.viewDemo')}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-muted-foreground text-sm">{t('common.noResults')}</p>
          </div>
        )}
        {!error && filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.noResults')}
          </div>
        )}
      </div>
    </section>
  );
}
