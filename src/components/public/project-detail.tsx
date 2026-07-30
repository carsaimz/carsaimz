'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  FolderOpen,
  Calendar,
  User,
  Star,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RichTextRenderer } from '@/components/common/rich-text-editor';
import { useLanguage } from '@/contexts/language-context';
import { resolveI18nContent } from '@/lib/i18n-content';
import { apiFetch, safeJson } from '@/lib/api-fetch';

interface ProjectData {
  id: string;
  slug: string;
  title: string;
  titleI18n: string | null;
  description: string | null;
  descriptionI18n: string | null;
  client: string | null;
  technologies: string | null;
  demoUrl: string | null;
  images: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const colorPalettes = [
  'from-emerald-500 to-teal-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-600 to-green-700',
  'from-teal-600 to-emerald-700',
];

export function ProjectDetail() {
  const { t, language, formatDate } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || slug === '__dynamic__') {
      setLoading(false);
      return;
    }

    apiFetch(`/api/projects`)
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && data.success && data.data) {
          const found = data.data.find((p: ProjectData) => p.slug === slug);
          if (found) {
            setProject(found);
          } else {
            setError(t('common.notFound') || 'Project not found');
          }
        } else {
          setError('Failed to load project');
        }
      })
      .catch(() => {
        setError('Network error');
      })
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error || t('common.notFound') || 'Project not found'}
          </h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back') || 'Back to Projects'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const techs = project.technologies
    ? project.technologies.split(',').map((t) => t.trim())
    : [];
  const resolvedTitle = resolveI18nContent(project.titleI18n, project.title, language);
  const resolvedDescription = resolveI18nContent(project.descriptionI18n, project.description || '', language);
  const gradient = colorPalettes[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('projects.title') || 'Projects'}
          </Button>
        </motion.div>

        {/* Hero image / gradient */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div
            className={`h-48 md:h-72 bg-gradient-to-br ${gradient} rounded-xl relative flex items-center justify-center overflow-hidden`}
          >
            <FolderOpen className="h-20 w-20 text-white/60" />
            {project.isFeatured && (
              <Badge className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 border-0 text-sm font-semibold">
                <Star className="h-3.5 w-3.5 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Title & Meta */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {resolvedTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {project.client && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {t('projects.client') || 'Client'}: {project.client}
              </span>
            )}
            {project.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(project.createdAt)}
              </span>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {t('projects.viewDemo') || 'View Demo'}
              </a>
            )}
          </div>
        </motion.div>

        {/* Technologies */}
        {techs.length > 0 && (
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              {t('admin.technologies') || 'Technologies'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {techs.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        <Separator className="mb-8" />

        {/* Description / Content */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('admin.description') || 'Description'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedDescription && resolvedDescription.includes('<') ? (
                <RichTextRenderer content={resolvedDescription} />
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {resolvedDescription || t('common.noDescription') || 'No description available.'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        {project.demoUrl && (
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
              onClick={() => window.open(project.demoUrl!, '_blank')}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              {t('projects.viewDemo') || 'View Demo'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
