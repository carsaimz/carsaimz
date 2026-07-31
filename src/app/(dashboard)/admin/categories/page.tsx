'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Plus, Pencil, Trash2, Tag, FileText, Globe, FolderOpen,
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

type CategoryType = 'posts' | 'services' | 'projects';

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

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

// ============================================================================
// Component
// ============================================================================

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  useDocumentTitle('admin.categories', 'Categorias');
  const { toast } = useToast();

  // Active tab
  const [activeType, setActiveType] = useState<CategoryType>('posts');

  // Categories state per type
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ============================================================================
  // Fetch categories
  // ============================================================================

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/categories?type=${activeType}`);
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ============================================================================
  // Auto-generate slug from name
  // ============================================================================

  const handleNameChange = (value: string) => {
    setFormName(value);
    if (isCreate || !editingCategory) {
      setFormSlug(slugify(value));
    }
  };

  // ============================================================================
  // Open create dialog
  // ============================================================================

  const openCreate = () => {
    setIsCreate(true);
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setDialogOpen(true);
  };

  // ============================================================================
  // Open edit dialog
  // ============================================================================

  const openEdit = (cat: Category) => {
    setIsCreate(false);
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setDialogOpen(true);
  };

  // ============================================================================
  // Save category (create or update)
  // ============================================================================

  const handleSave = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      toast({ title: 'Error', description: 'Name and slug are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        const res = await apiFetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, slug: formSlug, type: activeType }),
        });
        const data = await safeJson(res);
        if (data?.success) {
          toast({ title: t('common.success'), description: 'Category created successfully' });
          fetchCategories();
          setDialogOpen(false);
        } else {
          toast({ title: 'Error', description: data?.message || 'Failed to create category', variant: 'destructive' });
        }
      } else if (editingCategory) {
        const res = await apiFetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, name: formName, slug: formSlug, type: activeType }),
        });
        const data = await safeJson(res);
        if (data?.success) {
          toast({ title: t('common.success'), description: 'Category updated successfully' });
          fetchCategories();
          setDialogOpen(false);
        } else {
          toast({ title: 'Error', description: data?.message || 'Failed to update category', variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error('Save category error:', err);
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Delete category
  // ============================================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/admin/categories?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await safeJson(res);
      if (data?.success) {
        toast({ title: t('common.success'), description: 'Category deleted successfully' });
        fetchCategories();
        setDeleteTarget(null);
      } else {
        toast({ title: 'Error', description: data?.message || 'Failed to delete category', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Delete category error:', err);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    }
  };

  // ============================================================================
  // Type label helper
  // ============================================================================

  const getTypeLabel = (type: CategoryType): string => {
    switch (type) {
      case 'posts': return t('admin.posts');
      case 'services': return t('admin.services');
      case 'projects': return t('admin.projects');
      default: return type;
    }
  };

  const getTypeIcon = (type: CategoryType) => {
    switch (type) {
      case 'posts': return FileText;
      case 'services': return Globe;
      case 'projects': return FolderOpen;
      default: return Tag;
    }
  };

  // ============================================================================
  // Render category list for a type
  // ============================================================================

  const renderCategoryList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No categories found for {getTypeLabel(activeType)}</p>
          <p className="text-xs mt-1">Click &quot;Add Category&quot; to create one</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat, index) => (
              <TableRow key={cat.id}>
                <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {cat.type || activeType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(cat)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.categories')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage categories for posts, services, and projects
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="size-5" />
                {t('admin.categories')}
              </CardTitle>
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="size-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeType} onValueChange={(v) => setActiveType(v as CategoryType)}>
              <TabsList className="mb-4">
                {(['posts', 'services', 'projects'] as CategoryType[]).map((type) => {
                  const Icon = getTypeIcon(type);
                  return (
                    <TabsTrigger key={type} value={type} className="gap-1.5">
                      <Icon className="size-3.5" />
                      {getTypeLabel(type)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(['posts', 'services', 'projects'] as CategoryType[]).map((type) => (
                <TabsContent key={type} value={type}>
                  {activeType === type && renderCategoryList()}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreate ? 'Create Category' : 'Edit Category'}</DialogTitle>
            <DialogDescription>
              {isCreate
                ? `Add a new category for ${getTypeLabel(activeType)}`
                : 'Update the category details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="Category name"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                placeholder="category-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {getTypeLabel(activeType)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (auto-assigned based on active tab)
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : isCreate ? (
                'Create'
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
