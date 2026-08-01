'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { type LanguageCode, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n';
import { LanguageTabs } from '@/components/common/language-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { ImageUpload } from '@/components/common/image-upload';
import {
  Plus, Pencil, Trash2, Users, Eye, EyeOff,
  Mail, Phone, MessageCircle,
  Linkedin, Github, Twitter, Facebook, Globe, ExternalLink,
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

interface Member {
  id: string;
  name: string;
  nameI18n?: string | null;
  role: string;
  roleI18n?: string | null;
  description?: string | null;
  descriptionI18n?: string | null;
  image?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  website?: string | null;
  order?: number;
  isPublished?: boolean;
  createdAt?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// Component
// ============================================================================

export default function AdminMembersPage() {
  useDocumentTitle('admin.members', 'Members');
  const { t } = useLanguage();
  const { toast } = useToast();

  // State
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state - default language values
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formTwitter, setFormTwitter] = useState('');
  const [formFacebook, setFormFacebook] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formPublished, setFormPublished] = useState(false);

  // Form state - i18n values per language
  const [formNameI18n, setFormNameI18n] = useState<Record<string, string>>({});
  const [formRoleI18n, setFormRoleI18n] = useState<Record<string, string>>({});
  const [formDescI18n, setFormDescI18n] = useState<Record<string, string>>({});

  // i18n non-default languages
  const i18nLangs = AVAILABLE_LANGUAGES.filter((code) => code !== DEFAULT_LANGUAGE);

  // i18n field handler
  const setI18nValue = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    lang: LanguageCode,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [lang]: value }));
  };

  // Fetch data
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/members');
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Open create dialog
  const openCreate = () => {
    setIsCreate(true);
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (item: Member) => {
    setIsCreate(false);
    setEditingItem(item);
    populateForm(item);
    setDialogOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormDescription('');
    setFormImage(null);
    setFormEmail('');
    setFormPhone('');
    setFormWhatsapp('');
    setFormLinkedin('');
    setFormGithub('');
    setFormTwitter('');
    setFormFacebook('');
    setFormWebsite('');
    setFormOrder('0');
    setFormPublished(false);
    setFormNameI18n({});
    setFormRoleI18n({});
    setFormDescI18n({});
  };

  // Populate form from item
  const populateForm = (item: Member) => {
    setFormName(item.name || '');
    setFormRole(item.role || '');
    setFormDescription(item.description || '');
    setFormImage(item.image || null);
    setFormEmail(item.email || '');
    setFormPhone(item.phone || '');
    setFormWhatsapp(item.whatsapp || '');
    setFormLinkedin(item.linkedin || '');
    setFormGithub(item.github || '');
    setFormTwitter(item.twitter || '');
    setFormFacebook(item.facebook || '');
    setFormWebsite(item.website || '');
    setFormOrder(String(item.order ?? 0));
    setFormPublished(item.isPublished ?? false);
    setFormNameI18n(parseI18n(item.nameI18n));
    setFormRoleI18n(parseI18n(item.roleI18n));
    setFormDescI18n(parseI18n(item.descriptionI18n));
  };

  // Build request body
  const buildRequestBody = () => {
    const nameI18nStr = stringifyI18n(formNameI18n);
    const roleI18nStr = stringifyI18n(formRoleI18n);
    const descI18nStr = stringifyI18n(formDescI18n);

    const base = isCreate ? {} : { id: editingItem?.id };

    return {
      ...base,
      name: formName,
      nameI18n: nameI18nStr,
      role: formRole,
      roleI18n: roleI18nStr,
      description: formDescription || null,
      descriptionI18n: descI18nStr,
      image: formImage,
      email: formEmail || null,
      phone: formPhone || null,
      whatsapp: formWhatsapp || null,
      linkedin: formLinkedin || null,
      github: formGithub || null,
      twitter: formTwitter || null,
      facebook: formFacebook || null,
      website: formWebsite || null,
      order: parseInt(formOrder) || 0,
      isPublished: formPublished,
    };
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!formName.trim() || !formRole.trim()) {
      toast({ title: 'Error', description: 'Name and role are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const endpoint = '/api/admin/members';
      const method = isCreate ? 'POST' : 'PUT';
      const body = buildRequestBody();

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);
      if (!data) { toast({ title: 'Error', description: 'Server returned non-JSON response', variant: 'destructive' }); return; }
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

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/admin/members?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await safeJson(res);
      if (!data) { toast({ title: 'Error', description: 'Server returned non-JSON response', variant: 'destructive' }); return; }
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
  const togglePublish = async (item: Member) => {
    try {
      const res = await apiFetch('/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPublished: !item.isPublished }),
      });

      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        toast({ title: t('admin.togglePublish'), description: 'Status updated' });
        fetchItems();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <div className="space-y-5">
      {/* Name with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.name') || 'Name'}</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="João Silva"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.name') || 'Name'} ({lang})</Label>
              <Input
                value={formNameI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormNameI18n, lang, e.target.value)}
                placeholder={`Name in ${lang}`}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Role with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.role') || 'Role'}</Label>
            <Input
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="Desenvolvedor Full-stack"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.role') || 'Role'} ({lang})</Label>
              <Input
                value={formRoleI18n[lang] || ''}
                onChange={(e) => setI18nValue(setFormRoleI18n, lang, e.target.value)}
                placeholder={`Role in ${lang}`}
                className="focus-visible:ring-emerald-500"
              />
            </div>,
          ])
        )}
      />

      {/* Description with language tabs */}
      <LanguageTabs
        defaultLanguageFields={
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Breve descrição do membro da equipa..."
              rows={3}
              className="focus-visible:ring-emerald-500"
            />
          </div>
        }
        i18nLanguageFields={Object.fromEntries(
          i18nLangs.map((lang) => [
            lang,
            <div className="space-y-2" key={lang}>
              <Label className="text-sm font-medium">{t('admin.description') || 'Description'} ({lang})</Label>
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

      {/* Profile Image */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('admin.avatar') || 'Photo'}</Label>
        <ImageUpload
          value={formImage}
          onChange={setFormImage}
          type="avatar"
          placeholder="Upload a profile photo"
          maxSize={2}
          maxDimension={400}
        />
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('admin.contact') || 'Contact Information'}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="size-3.5" /> Email
            </Label>
            <Input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="joao@example.com"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="size-3.5" /> Phone
            </Label>
            <Input
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+258 84 123 4567"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> WhatsApp
            </Label>
            <Input
              value={formWhatsapp}
              onChange={(e) => setFormWhatsapp(e.target.value)}
              placeholder="+258 84 123 4567"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('admin.socialLinks') || 'Social Links'}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Linkedin className="size-3.5" /> LinkedIn
            </Label>
            <Input
              value={formLinkedin}
              onChange={(e) => setFormLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Github className="size-3.5" /> GitHub
            </Label>
            <Input
              value={formGithub}
              onChange={(e) => setFormGithub(e.target.value)}
              placeholder="https://github.com/username"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Twitter className="size-3.5" /> Twitter/X
            </Label>
            <Input
              value={formTwitter}
              onChange={(e) => setFormTwitter(e.target.value)}
              placeholder="https://x.com/username"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Facebook className="size-3.5" /> Facebook
            </Label>
            <Input
              value={formFacebook}
              onChange={(e) => setFormFacebook(e.target.value)}
              placeholder="https://facebook.com/username"
              className="focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="size-3.5" /> Website
            </Label>
            <Input
              value={formWebsite}
              onChange={(e) => setFormWebsite(e.target.value)}
              placeholder="https://example.com"
              className="focus-visible:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Order & Published */}
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('admin.order') || 'Order'}</Label>
          <Input
            type="number"
            value={formOrder}
            onChange={(e) => setFormOrder(e.target.value)}
            placeholder="0"
            className="w-24 focus-visible:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={formPublished} onCheckedChange={setFormPublished} />
          <Label className="text-sm">{t('admin.published') || 'Published'}</Label>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.members') || 'Members'}
          </h2>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.createNew') || 'Create new'}
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
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No items found'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{t('admin.name') || 'Name'}</TableHead>
                    <TableHead>{t('admin.role') || 'Role'}</TableHead>
                    <TableHead className="w-16 text-center">{t('admin.order') || 'Order'}</TableHead>
                    <TableHead>{t('admin.status') || 'Status'}</TableHead>
                    <TableHead className="w-28">{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Avatar className="size-8">
                          {item.image ? (
                            <AvatarImage src={item.image} alt={item.name} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {getInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {item.role}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {item.order ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.isPublished ? 'default' : 'secondary'}
                          className={item.isPublished ? 'bg-emerald-600 text-white' : ''}
                        >
                          {item.isPublished ? (t('admin.published') || 'Published') : (t('admin.draft') || 'Draft')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8"
                            onClick={() => togglePublish(item)}
                            title={t('admin.togglePublish') || 'Toggle publish'}
                          >
                            {item.isPublished ? (
                              <Eye className="size-4 text-emerald-600 dark:text-emerald-400" />
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
              {isCreate
                ? `${t('admin.createNew') || 'Create new'} — ${t('admin.members') || 'Members'}`
                : `${t('admin.editItem') || 'Edit'} — ${t('admin.members') || 'Members'}`
              }
            </DialogTitle>
            <DialogDescription>
              {t('admin.contentManager') || 'Content Management'}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {renderForm()}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('admin.cancel') || 'Cancel'}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : (t('admin.save') || 'Save')}
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
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t('admin.deleteItem') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
