'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
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
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Plus, Pencil, Trash2, Pin, Lock, CheckCircle2, MessageSquare, FolderOpen,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  createdAt: string;
  nameI18n?: Record<string, string> | null;
}

interface ForumTopic {
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
  categoryName?: string;
}

type TabView = 'categories' | 'topics';

export function AdminForumManager() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabView>('categories');

  // Categories state
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Topics state
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // Category form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catIsCreate, setCatIsCreate] = useState(true);
  const [catEditing, setCatEditing] = useState<ForumCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catNameI18n, setCatNameI18n] = useState<Record<string, string>>({});
  const [catSaving, setCatSaving] = useState(false);

  // Topic form
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [topicEditing, setTopicEditing] = useState<ForumTopic | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicCategoryId, setTopicCategoryId] = useState('');
  const [topicIsPinned, setTopicIsPinned] = useState(false);
  const [topicIsLocked, setTopicIsLocked] = useState(false);
  const [topicIsResolved, setTopicIsResolved] = useState(false);
  const [topicSaving, setTopicSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'topic'; id: string } | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await apiFetch('/api/admin/forum/categories');
      const data = await safeJson(res);
      if (data && data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const res = await apiFetch('/api/admin/forum/topics');
      const data = await safeJson(res);
      if (data && data.success) {
        setTopics(data.data || []);
      }
    } catch (err) {
      console.error('Topics fetch error:', err);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, [fetchCategories, fetchTopics]);

  // Category CRUD
  const openCreateCategory = () => {
    setCatIsCreate(true);
    setCatEditing(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCatOrder('0');
    setCatNameI18n({});
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: ForumCategory) => {
    setCatIsCreate(false);
    setCatEditing(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
    setCatOrder(String(cat.order || 0));
    setCatNameI18n(cat.nameI18n || {});
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    setCatSaving(true);
    try {
      const endpoint = '/api/admin/forum/categories';
      const method = catIsCreate ? 'POST' : 'PUT';
      const body = catIsCreate
        ? { name: catName, slug: catSlug, description: catDescription, order: parseInt(catOrder) || 0, nameI18n: Object.keys(catNameI18n).length > 0 ? catNameI18n : undefined }
        : { id: catEditing?.id, name: catName, slug: catSlug, description: catDescription, order: parseInt(catOrder) || 0, nameI18n: Object.keys(catNameI18n).length > 0 ? catNameI18n : null };

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: catIsCreate ? t('admin.created') : t('admin.updated'), description: t('admin.itemSaved') });
        setCatDialogOpen(false);
        fetchCategories();
      } else {
        toast({ title: t('common.error'), description: data?.message || t('admin.failedSave'), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('admin.failedSave'), variant: 'destructive' });
    } finally {
      setCatSaving(false);
    }
  };

  // Topic moderation
  const openEditTopic = (topic: ForumTopic) => {
    setTopicEditing(topic);
    setTopicTitle(topic.title);
    setTopicCategoryId(topic.categoryId);
    setTopicIsPinned(topic.isPinned);
    setTopicIsLocked(topic.isLocked);
    setTopicIsResolved(topic.isResolved);
    setTopicDialogOpen(true);
  };

  const saveTopic = async () => {
    if (!topicEditing) return;
    setTopicSaving(true);
    try {
      const res = await apiFetch('/api/admin/forum/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: topicEditing.id,
          isPinned: topicIsPinned,
          isLocked: topicIsLocked,
          isResolved: topicIsResolved,
          categoryId: topicCategoryId,
        }),
      });

      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.updated'), description: t('admin.itemUpdated') });
        setTopicDialogOpen(false);
        fetchTopics();
      } else {
        toast({ title: t('common.error'), description: data?.message || t('admin.failedUpdate'), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('admin.failedUpdate'), variant: 'destructive' });
    } finally {
      setTopicSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoint = deleteTarget.type === 'category'
        ? `/api/admin/forum/categories?id=${deleteTarget.id}`
        : `/api/admin/forum/topics?id=${deleteTarget.id}`;

      const res = await apiFetch(endpoint, { method: 'DELETE' });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.deleted'), description: t('admin.itemDeleted') });
        if (deleteTarget.type === 'category') fetchCategories();
        else fetchTopics();
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('admin.failedDelete'), variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Auto-generate slug
  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            {t('admin.forum') || 'Forum Management'}
          </h2>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            className={activeTab === 'categories' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            onClick={() => setActiveTab('categories')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            {t('admin.categories') || 'Categories'}
          </Button>
          <Button
            variant={activeTab === 'topics' ? 'default' : 'outline'}
            className={activeTab === 'topics' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            onClick={() => setActiveTab('topics')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('admin.topics') || 'Topics'}
          </Button>
        </div>
      </motion.div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.categories') || 'Categories'}</CardTitle>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                  onClick={openCreateCategory}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.createNew') || 'New Category'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {categoriesLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No categories'}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.itemTitle') || 'Name'}</TableHead>
                      <TableHead>{t('admin.slug')}</TableHead>
                      <TableHead>{t('admin.order') || 'Order'}</TableHead>
                      <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{cat.slug}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.order || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="size-8" onClick={() => openEditCategory(cat)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'category', id: cat.id })}>
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
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.topics') || 'Topics'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topicsLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
              ) : topics.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No topics'}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.itemTitle') || 'Title'}</TableHead>
                      <TableHead>{t('admin.category')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          <div className="flex items-center gap-1.5">
                            {topic.isPinned && <Pin className="h-3 w-3 text-emerald-600" />}
                            {topic.isLocked && <Lock className="h-3 w-3 text-orange-500" />}
                            {topic.isResolved && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                            {topic.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {topic.categoryName || topic.categoryId}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {topic.isPinned && <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{t('admin.pinned')}</Badge>}
                            {topic.isLocked && <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700">{t('admin.locked')}</Badge>}
                            {topic.isResolved && <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">{t('admin.resolved')}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="size-8" onClick={() => openEditTopic(topic)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'topic', id: topic.id })}>
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
      )}

      {/* Category Create/Edit Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {catIsCreate ? `${t('admin.createNew') || 'New'} — ${t('admin.categories') || 'Category'}` : `${t('admin.editItem') || 'Edit'} — ${t('admin.categories') || 'Category'}`}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Manage forum categories'}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.itemTitle') || 'Name'}</Label>
              <Input
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (catIsCreate && !catSlug) setCatSlug(slugify(e.target.value));
                }}
                placeholder={t('admin.categoryName')}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.slug')}</Label>
              <Input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="category-slug"
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
              <Textarea
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                placeholder={t('admin.categoryDescription')}
                rows={2}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.order') || 'Order'}</Label>
              <Input
                type="number"
                value={catOrder}
                onChange={(e) => setCatOrder(e.target.value)}
                placeholder="0"
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('admin.translations') || 'Translations'} (i18n)
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('admin.i18nDescription') || 'Provide translated names for each language. The default name (above) is used as fallback.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['en-us', 'pt-br', 'fr-fr', 'es-es', 'zh-cn', 'de-de', 'sw-tz'].map((langCode) => (
                  <div key={langCode} className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-14 shrink-0">{langCode}</Label>
                    <Input
                      value={catNameI18n[langCode] || ''}
                      onChange={(e) => setCatNameI18n((prev) => ({ ...prev, [langCode]: e.target.value }))}
                      placeholder={catName}
                      className="h-8 text-sm focus-visible:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>{t('admin.cancel') || 'Cancel'}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveCategory} disabled={catSaving}>
              {catSaving ? t('admin.saving') : t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Edit Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('admin.editItem') || 'Edit'} — {t('admin.topics') || 'Topic'}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Moderate forum topic'}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.itemTitle') || 'Title'}</Label>
              <Input value={topicTitle} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.category') || 'Category'}</Label>
              <Select value={topicCategoryId} onValueChange={setTopicCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={topicIsPinned} onCheckedChange={setTopicIsPinned} />
                <Label className="text-sm"><Pin className="h-3 w-3 mr-1 inline" />{t('admin.pinned')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={topicIsLocked} onCheckedChange={setTopicIsLocked} />
                <Label className="text-sm"><Lock className="h-3 w-3 mr-1 inline" />{t('admin.locked')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={topicIsResolved} onCheckedChange={setTopicIsResolved} />
                <Label className="text-sm"><CheckCircle2 className="h-3 w-3 mr-1 inline" />{t('admin.resolved')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>{t('admin.cancel') || 'Cancel'}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveTopic} disabled={topicSaving}>
              {topicSaving ? t('admin.saving') : t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteItem') || 'Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirmDelete') || 'Are you sure you want to delete this item?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              {t('admin.deleteItem') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
