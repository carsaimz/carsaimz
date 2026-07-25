'use client';

import { useState, useEffect } from 'react';
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

interface ProjectData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  client: string | null;
  technologies: string | null;
  demoUrl: string | null;
  images: string | null;
  isFeatured: boolean;
  isPublished: boolean;
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
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setProjects(data.data);
        }
      })
      .catch(() => {
        // Error - show empty state, no fallback
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
    <section id="projects" className="py-16 sm:py-24 bg-muted/30">
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
              <SelectItem value="featured">Featured</SelectItem>
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
              ? project.technologies.split(',').map((t) => t.trim())
              : [];

            return (
              <motion.div key={project.id} variants={cardVariants}>
                <Card className="group hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
                  {/* Image placeholder */}
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

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-snug">
                      {project.title}
                    </CardTitle>
                    {project.client && (
                      <p className="text-sm text-muted-foreground">
                        {t('projects.client')}: {project.client}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pb-3">
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
                      {project.description}
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

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.noResults')}
          </div>
        )}
      </div>
    </section>
  );
}
