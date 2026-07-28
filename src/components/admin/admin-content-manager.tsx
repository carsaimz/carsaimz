'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { type LanguageCode, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n';
import { LanguageTabs } from '@/components/common/language-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, Star, Globe, Eye, EyeOff,
} from 'lucide-react';

// ============================================================================
// Animation
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============================================================================
// Types
// ============================================================================

type ContentType = 'services' | 'projects' | 'posts' | 'testimonials';

interface ContentItem {
  id: string;
  title?: string;
  name?: string;
  slug?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  titleI18n?: string | null;
  descriptionI18n?: string | null;
  excerptI18n?: string | null;
  contentI18n?: string | null;
  contentI18nField?: string | null;
  icon?: string | null;
  basePrice?: number | null;
  order?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  published?: boolean;
  client?: string | null;
  technologies?: string | null;
  demoUrl?: string | null;
  company?: string | null;
  rating?: number;
  categoryId?: string | null;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const SERVICE_ICONS = [
  'Globe', 'Smartphone', 'ShoppingCart', 'BarChart3', 'Shield',
  'Cloud', 'Database', 'Cpu', 'Palette', 'Camera',
  'Search', 'Code2', 'Layout', 'Server', 'Headphones',
];

// ============================================================================
// Helper Functions
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseI18n(jsonStr: string | null | undefined): Record<string, string> {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

function stringifyI18n(obj: Record<string, string>): string | null {
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v && v.trim())
  );
  if (Object.keys(filtered).length === 0) return null;
  return JSON.stringify(filtered);
}

function getApiEndpoint(type: ContentType): string {
  return `/api/admin/${type}`;
}

// ============================================================================
// Component
// ============================================================================

export function AdminContentManager({ contentType }: { contentType: ContentType }) {
  const { t } = useLanguage();
  const { toast } = useToast();

  // State
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state - default language values
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(false);
  const [formClient, setFormClient] = useState('');
  const [formTechnologies, setFormTechnologies] = useState('');
  const [formDemoUrl, setFormDemoUrl] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formCategoryId, setFormCategoryId] = useState('');

  // Form state - i18n values per language
  const [formTitleI18n, setFormTitleI18n] = useState<Record<string, string>>({});
  const [formDescI18n, setFormDescI18n] = useState<Record<string, string>>({});
  const [formExcerptI18n, setFormExcerptI18n] = useState<Record<string, string>>({});
  const [formContentI18n, setFormContentI18n] = useState<Record<string, string>>({});

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setFormTitle(value);
    if (isCreate && !formSlug) {
      setFormSlug(slugify(value));
    }
  };

  // Fetch data
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiEndpoint(contentType));
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  const fetchCategories = useCallback(async () => {
    if (contentType !== 'posts') return;
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  }, [contentType]);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  // Open create dialog
  const openCreate = () => {
    setIsCreate(true);
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (item: ContentItem) => {
    setIsCreate(false);
    setEditingItem(item);
    populateForm(item);
    setDialogOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormExcerpt('');
    setFormContent('');
    setFormIcon('');
    setFormBasePrice('');
    setFormOrder('0');
    setFormFeatured(false);
    setFormPublished(false);
    setFormClient('');
    setFormTechnologies('');
    setFormDemoUrl('');
    setFormName('');
    setFormCompany('');
    setFormRating(5);
    setFormCategoryId('');
    setFormTitleI18n({});
    setFormDescI18n({});
    setFormExcerptI18n({});
    setFormContentI18n({});
  };

  // Populate form from item
  const populateForm = (item: ContentItem) => {
    setFormTitle(item.title || item.name || '');
    setFormSlug(item.slug || '');
    setFormDescription(item.description || '');
    setFormExcerpt(item.excerpt || '');
    setFormContent(item.content || '');
    setFormIcon(item.icon || '');
    setFormBasePrice(item.basePrice ? String(item.basePrice) : '');
    setFormOrder(String(item.order || 0));
    setFormFeatured(item.isFeatured || false);
    setFormPublished(item.isPublished || item.published || false);
    setFormClient(item.client || '');
    setFormTechnologies(item.technologies || '');
    setFormDemoUrl(item.demoUrl || '');
    setFormName(item.name || '');
    setFormCompany(item.company || '');
    setFormRating(item.rating || 5);
    setFormCategoryId(item.categoryId || '');
    setFormTitleI18n(parseI18n(item.titleI18n));
    setFormDescI18n(parseI18n(item.descriptionI18n));
    setFormExcerptI18n(parseI18n(item.excerptI18n));
    setFormContentI18n(parseI18n(item.contentI18n || item.contentI18nField));
  };

  // Save (create or update)
  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = getApiEndpoint(contentType);
      const method = isCreate ? 'POST' : 'PUT';
      const body = buildRequestBody();

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: isCreate ? t('admin.createNew') : t('admin.editItem'), description: 'Saved successfully' });
        setDialogOpen(false);
        fetchItems();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to save', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Build request body based on content type
  const buildRequestBody = () => {
    const titleI18nStr = stringifyI18n(formTitleI18n);
    const descI18nStr = stringifyI18n(formDescI18n);
    const excerptI18nStr = stringifyI18n(formExcerptI18n);
    const contentI18nStr = stringifyI18n(formContentI18n);

    const base = isCreate ? {} : { id: editingItem?.id };

    switch (contentType) {
      case 'services':
        return {
          ...base,
          title: formTitle,
          titleI18n: titleI18nStr,
          slug: formSlug,
          description: formDescription,
          descriptionI18n: descI18nStr,
          icon: formIcon,
          basePrice: formBasePrice ? parseFloat(formBasePrice) : null,
          order: parseInt(formOrder) || 0,
          isFeatured: formFeatured,
          isPublished: formPublished,
        };
      case 'projects':
        return {
          ...base,
          title: formTitle,
          titleI18n: titleI18nStr,
          slug: formSlug,
          description: formDescription,
          descriptionI18n: descI18nStr,
          client: formClient,
          technologies: formTechnologies,
          demoUrl: formDemoUrl,
          isFeatured: formFeatured,
          isPublished: formPublished,
        };
      case 'posts':
        return {
          ...base,
          title: formTitle,
          titleI18n: titleI18nStr,
          slug: formSlug,
          excerpt: formExcerpt,
          excerptI18n: excerptI18nStr,
          content: formContent,
          contentI18n: contentI18nStr,
          categoryId: formCategoryId || null,
          published: formPublished,
          authorId: (editingItem as any)?.authorId || 'default-author',
        };
      case 'testimonials':
        return {
          ...base,
          name: formName,
          company: formCompany,
          content: formContent,
          contentI18n: contentI18nStr,
          rating: formRating,
          isPublished: formPublished,
        };
      default:
        return base;
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${getApiEndpoint(contentType)}?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.deleteItem'), description: 'Deleted successfully' });
        fetchItems();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Toggle publish
  const togglePublish = async (item: ContentItem) => {
    try {
      const currentPublished = item.isPublished ?? item.published ?? false;
      const body = {
        id: item.id,
        isPublished: !currentPublished,
        published: !currentPublished,
      };

      // For services/projects/testimonials use isPublished; for posts use published
      const updateBody = contentType === 'posts'
        ? { id: item.id, published: !currentPublished }
        : { id: item.id, isPublished: !currentPublished };

      const res = await fetch(getApiEndpoint(contentType), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.togglePublish'), description: 'Status updated' });
        fetchItems();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // i18n field handlers
  const i18nLangs = AVAILABLE_LANGUAGES.filter((code) => code !== DEFAULT_LANGUAGE);

  const setI18nValue = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    lang: LanguageCode,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [lang]: value }));
  };

  // ============================================================================
  // Render form fields per content type
  // ============================================================================

  const renderServiceForm = () => (
    <div className="space-y-4">
      {/* Title with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.title')}</Label>
            <Input
              value={formTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nome do serviço"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.title')} ({lang})</Label>
              <Input
                value={formTitleI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormTitleI18n, lang, e.target.value)}
                placeholder={`Title in ${lang}`}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.slug')}</Label>
        <Input
          value={formSlug}
          onChange={(e) => setFormSlug(e.target.value)}
          placeholder="service-slug"
          className="focus-visible:ring-emerald-500"
        />
      </div>

      {/* Description with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.description')}</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descrição do serviço"
              rows={3}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.description')} ({lang})</Label>
              <Textarea
                value={formDescI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormDescI18n, lang, e.target.value)}
                placeholder={`Description in ${lang}`}
                rows={3}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Icon */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.icon')}</Label>
        <Select value={formIcon} onValueChange={setFormIcon}>
          <SelectTrigger className="w-full focus-visible:ring-emerald-500">
            <SelectValue placeholder="Select icon" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_ICONS.map((icon) => (
              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Base Price & Order */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.basePrice')} (MT)</Label>
          <Input
            type="number"
            value={formBasePrice}
            onChange={(e) => setFormBasePrice(e.target.value)}
            placeholder="0"
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.order')}</Label>
          <Input
            type="number"
            value={formOrder}
            onChange={(e) => setFormOrder(e.target.value)}
            placeholder="0"
            className="focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Featured & Published toggles */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
          <Label className="text-sm">{t('admin.featured')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={formPublished} onCheckedChange={setFormPublished} />
          <Label className="text-sm">{t('admin.published')}</Label>
        </div>
      </div>
    </div>
  );

  const renderProjectForm = () => (
    <div className="space-y-4">
      {/* Title with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.title')}</Label>
            <Input
              value={formTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nome do projeto"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.title')} ({lang})</Label>
              <Input
                value={formTitleI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormTitleI18n, lang, e.target.value)}
                placeholder={`Title in ${lang}`}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.slug')}</Label>
        <Input
          value={formSlug}
          onChange={(e) => setFormSlug(e.target.value)}
          placeholder="project-slug"
          className="focus-visible:ring-emerald-500"
        />
      </div>

      {/* Description with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.description')}</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descrição do projeto"
              rows={3}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.description')} ({lang})</Label>
              <Textarea
                value={formDescI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormDescI18n, lang, e.target.value)}
                placeholder={`Description in ${lang}`}
                rows={3}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Client, Technologies, Demo URL */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.client')}</Label>
          <Input
            value={formClient}
            onChange={(e) => setFormClient(e.target.value)}
            placeholder="Nome do cliente"
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.technologies')}</Label>
          <Input
            value={formTechnologies}
            onChange={(e) => setFormTechnologies(e.target.value)}
            placeholder="React, Node.js, TypeScript (separado por vírgulas)"
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.demoUrl')}</Label>
          <Input
            value={formDemoUrl}
            onChange={(e) => setFormDemoUrl(e.target.value)}
            placeholder="https://demo.example.com"
            className="focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Featured & Published toggles */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
          <Label className="text-sm">{t('admin.featured')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={formPublished} onCheckedChange={setFormPublished} />
          <Label className="text-sm">{t('admin.published')}</Label>
        </div>
      </div>
    </div>
  );

  const renderPostForm = () => (
    <div className="space-y-4">
      {/* Title with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.title')}</Label>
            <Input
              value={formTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do artigo"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.title')} ({lang})</Label>
              <Input
                value={formTitleI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormTitleI18n, lang, e.target.value)}
                placeholder={`Title in ${lang}`}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.slug')}</Label>
        <Input
          value={formSlug}
          onChange={(e) => setFormSlug(e.target.value)}
          placeholder="post-slug"
          className="focus-visible:ring-emerald-500"
        />
      </div>

      {/* Excerpt with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.excerpt')}</Label>
            <Textarea
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              placeholder="Resumo do artigo"
              rows={2}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.excerpt')} ({lang})</Label>
              <Textarea
                value={formExcerptI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormExcerptI18n, lang, e.target.value)}
                placeholder={`Excerpt in ${lang}`}
                rows={2}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Content with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.content')}</Label>
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Conteúdo do artigo..."
              rows={8}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.content')} ({lang})</Label>
              <Textarea
                value={formContentI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormContentI18n, lang, e.target.value)}
                placeholder={`Content in ${lang}`}
                rows={8}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.category')}</Label>
        <Select value={formCategoryId} onValueChange={setFormCategoryId}>
          <SelectTrigger className="w-full focus-visible:ring-emerald-500">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={formPublished} onCheckedChange={setFormPublished} />
        <Label className="text-sm">{t('admin.published')}</Label>
      </div>
    </div>
  );

  const renderTestimonialForm = () => (
    <div className="space-y-4">
      {/* Name & Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.name')}</Label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nome do cliente"
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.company')}</Label>
          <Input
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            placeholder="Empresa"
            className="focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Content with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.content')}</Label>
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Testemunho do cliente"
              rows={3}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.content')} ({lang})</Label>
              <Textarea
                value={formContentI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormContentI18n, lang, e.target.value)}
                placeholder={`Testimonial in ${lang}`}
                rows={3}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.rating')}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={`p-1 ${star <= formRating ? 'text-emerald-500' : 'text-muted-foreground'}`}
              onClick={() => setFormRating(star)}
            >
              <Star className={`size-5 ${star <= formRating ? 'fill-emerald-500' : ''}`} />
            </Button>
          ))}
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={formPublished} onCheckedChange={setFormPublished} />
        <Label className="text-sm">{t('admin.published')}</Label>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (contentType) {
      case 'services': return renderServiceForm();
      case 'projects': return renderProjectForm();
      case 'posts': return renderPostForm();
      case 'testimonials': return renderTestimonialForm();
    }
  };

  // ============================================================================
  // Table columns per content type
  // ============================================================================

  const getItemTitle = (item: ContentItem): string => {
    return item.title || item.name || '—';
  };

  const getItemStatus = (item: ContentItem): boolean => {
    return item.isPublished ?? item.published ?? false;
  };

  const getContentLabel = (): string => {
    switch (contentType) {
      case 'services': return t('admin.services');
      case 'projects': return t('admin.projects');
      case 'posts': return t('admin.posts');
      case 'testimonials': return t('admin.testimonials');
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-600" />
            {getContentLabel()}
          </h2>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.createNew')}
          </Button>
        </div>
      </motion.div>

      {/* Content Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.title')}</TableHead>
                    {contentType !== 'testimonials' && (
                      <TableHead>{t('admin.slug')}</TableHead>
                    )}
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.date')}</TableHead>
                    <TableHead>{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {getItemTitle(item)}
                      </TableCell>
                      {contentType !== 'testimonials' && (
                        <TableCell className="text-muted-foreground text-xs">
                          {item.slug || '—'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={getItemStatus(item) ? 'default' : 'secondary'}
                          className={getItemStatus(item) ? 'bg-emerald-600 text-white' : ''}
                        >
                          {getItemStatus(item) ? t('admin.published') : t('admin.draft')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-MZ') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8"
                            onClick={() => togglePublish(item)}
                            title={t('admin.togglePublish')}
                          >
                            {getItemStatus(item) ? (
                              <Eye className="size-4 text-emerald-600" />
                            ) : (
                              <EyeOff className="size-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? `${t('admin.createNew')} — ${getContentLabel()}` : `${t('admin.editItem')} — ${getContentLabel()}`}
            </DialogTitle>
            <DialogDescription>
              {t('admin.contentManager')}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {renderForm()}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : t('admin.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t('admin.deleteItem')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
