'use client';

/**
 * Carsai Mozambique — Partner Ads Manager
 *
 * Partner page for creating and managing their own ads:
 * - Create new ad form with all fields
 * - List of partner's own ads with status
 * - View stats for each ad
 * - Edit/delete own pending ads
 * - Uses RichTextEditor for Quill content
 * - Uses ImageUpload for base64 images
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { useAuthStore } from '@/lib/store';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';
import { AD_PLACEMENTS, type AdPlacementId } from '@/lib/ad-placements';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { ImageUpload } from '@/components/common/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Plus, Pencil, Trash2, Eye, Megaphone, MousePointerClick,
  Target, TrendingUp, BarChart3, X,
} from 'lucide-react';

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Types ──

interface AdData {
  id: string;
  title: string;
  description: string;
  type: string;
  format: string;
  content: string;
  targetUrl: string;
  placement: string[];
  status: string;
  priority: number;
  impressions: number;
  clicks: number;
  conversions: number;
  maxImpressions: number;
  maxClicks: number;
  maxConversions: number;
  startDate: string;
  endDate: string | null;
  autoDeactivate: boolean;
  pixelUrls: string[];
  clickPixelUrls: string[];
  conversionPixelUrls: string[];
  partnerId: string;
  planId: string;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdPlanData {
  id: string;
  name: string;
  description: string;
  price: number;
  features: {
    maxAds: number;
    maxImpressions: number;
    placements: string[];
    formats: string[];
    customBranding: boolean;
    analytics: boolean;
    priority: number;
    supportLevel: string;
  };
  isFree: boolean;
  isActive: boolean;
}

// ── Default form state ──

const defaultForm = {
  title: '',
  description: '',
  type: 'banner' as string,
  format: 'image_base64' as string,
  content: '',
  targetUrl: '',
  placement: [] as string[],
  planId: '',
  priority: 50,
  maxImpressions: 0,
  maxClicks: 0,
  maxConversions: 0,
  startDate: '',
  endDate: '',
  autoDeactivate: true,
  pixelUrls: '',
  clickPixelUrls: '',
  conversionPixelUrls: '',
};

// ── Status color helper ──

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

// ── Component ──

export function PartnerAdsManager() {
  const { t, formatDate } = useLanguage();
  const { toast } = useToast();
  const { user, idToken } = useAuthStore();

  // ── State ──
  const [ads, setAds] = useState<AdData[]>([]);
  const [plans, setPlans] = useState<AdPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-ads');

  // Create/Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdData | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  // Stats dialog
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsAd, setStatsAd] = useState<AdData | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAd, setDeleteAd] = useState<AdData | null>(null);

  // ── Fetch ads ──
  const fetchAds = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      const res = await apiFetch('/api/partner/ads', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<{ success: boolean; data: AdData[] }>(res);
      if (data?.success) {
        setAds(data.data || []);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch ads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [idToken, toast]);

  // ── Fetch plans ──
  const fetchPlans = useCallback(async () => {
    if (!idToken) return;
    try {
      const res = await apiFetch('/api/admin/ads/plans', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<{ success: boolean; data: AdPlanData[] }>(res);
      if (data?.success) {
        setPlans(data.data || []);
      }
    } catch {
      // Silently ignore
    }
  }, [idToken]);

  useEffect(() => {
    fetchAds();
    fetchPlans();
  }, [fetchAds, fetchPlans]);

  // ── Form handlers ──

  const openCreateForm = () => {
    setEditingAd(null);
    setForm({ ...defaultForm });
    setFormOpen(true);
  };

  const openEditForm = (ad: AdData) => {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      description: ad.description,
      type: ad.type,
      format: ad.format,
      content: ad.content,
      targetUrl: ad.targetUrl,
      placement: ad.placement || [],
      planId: ad.planId,
      priority: ad.priority,
      maxImpressions: ad.maxImpressions,
      maxClicks: ad.maxClicks,
      maxConversions: ad.maxConversions || 0,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : '',
      autoDeactivate: ad.autoDeactivate,
      pixelUrls: ad.pixelUrls?.join('\n') || '',
      clickPixelUrls: ad.clickPixelUrls?.join('\n') || '',
      conversionPixelUrls: ad.conversionPixelUrls?.join('\n') || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.type || !form.format || !form.content || form.placement.length === 0 || !form.planId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        type: form.type,
        format: form.format,
        content: form.content,
        targetUrl: form.targetUrl,
        placement: form.placement,
        planId: form.planId,
        priority: form.priority,
        maxImpressions: form.maxImpressions,
        maxClicks: form.maxClicks,
        maxConversions: form.maxConversions,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        autoDeactivate: form.autoDeactivate,
        pixelUrls: form.pixelUrls ? form.pixelUrls.split('\n').filter((u) => u.trim()) : [],
        clickPixelUrls: form.clickPixelUrls ? form.clickPixelUrls.split('\n').filter((u) => u.trim()) : [],
        conversionPixelUrls: form.conversionPixelUrls ? form.conversionPixelUrls.split('\n').filter((u) => u.trim()) : [],
      };

      const url = editingAd ? `/api/ads/${editingAd.id}` : '/api/ads';
      const method = editingAd ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await safeJson<{ success: boolean; message?: string }>(res);
      if (data?.success) {
        toast({ title: t('ads.save'), description: editingAd ? 'Ad updated' : 'Ad created' });
        setFormOpen(false);
        setEditingAd(null);
        fetchAds();
      } else {
        const errorMsg = data?.message || (res.status === 401 ? 'Authentication required' : res.status === 403 ? 'Permission denied' : 'Failed to save ad');
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        console.error('[Partner Ads] Save failed:', res.status, data?.message);
      }
    } catch (err) {
      console.error('[Partner Ads] Save error:', err);
      toast({ title: 'Error', description: 'Failed to save ad — network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAd) return;
    try {
      const res = await apiFetch(`/api/ads/${deleteAd.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<{ success: boolean; message?: string }>(res);
      if (data?.success) {
        toast({ title: t('ads.delete'), description: 'Ad deleted' });
        setDeleteOpen(false);
        setDeleteAd(null);
        fetchAds();
      } else {
        const errorMsg = data?.message || 'Failed to delete ad';
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        console.error('[Partner Ads] Delete failed:', res.status, data?.message);
      }
    } catch (err) {
      console.error('[Partner Ads] Delete error:', err);
      toast({ title: 'Error', description: 'Failed to delete ad — network error', variant: 'destructive' });
    }
  };

  // ── Computed stats ──
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalConversions = ads.reduce((sum, a) => sum + (a.conversions || 0), 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // ── Render ──
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          {t('ads.title')}
        </h1>
        <Button onClick={openCreateForm} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t('ads.createAd')}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Eye className="h-4 w-4" />
              {t('ads.impressions')}
            </div>
            <p className="text-2xl font-bold mt-1">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MousePointerClick className="h-4 w-4" />
              {t('ads.clicks')}
            </div>
            <p className="text-2xl font-bold mt-1">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              {t('ads.ctr')}
            </div>
            <p className="text-2xl font-bold mt-1">{overallCTR}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="h-4 w-4" />
              {t('ads.conversions')}
            </div>
            <p className="text-2xl font-bold mt-1">{totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ads List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ads.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t('ads.noAds')}</p>
                <Button onClick={openCreateForm} variant="outline" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t('ads.createAd')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ads.title')}</TableHead>
                      <TableHead>{t('ads.type')}</TableHead>
                      <TableHead>{t('ads.status')}</TableHead>
                      <TableHead>{t('ads.placement')}</TableHead>
                      <TableHead>{t('ads.impressions')}</TableHead>
                      <TableHead>{t('ads.clicks')}</TableHead>
                      <TableHead>{t('ads.ctr')}</TableHead>
                      <TableHead>{t('ads.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => {
                      const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                      const canEdit = ad.status === 'pending';
                      const canDelete = ad.status === 'pending';
                      return (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {ad.title}
                            {ad.rejectedReason && (
                              <p className="text-xs text-red-500 mt-0.5 truncate">{ad.rejectedReason}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {ad.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs capitalize ${getStatusColor(ad.status)}`}>
                              {t(`ads.${ad.status}`) || ad.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="flex flex-wrap gap-1">
                              {ad.placement?.slice(0, 2).map((p) => (
                                <Badge key={p} variant="secondary" className="text-[10px]">
                                  {AD_PLACEMENTS[p as AdPlacementId]?.name || p}
                                </Badge>
                              ))}
                              {ad.placement?.length > 2 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{ad.placement.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{ad.impressions?.toLocaleString() || 0}</TableCell>
                          <TableCell className="text-sm">{ad.clicks?.toLocaleString() || 0}</TableCell>
                          <TableCell className="text-sm">{ctr}%</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* Stats */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => { setStatsAd(ad); setStatsOpen(true); }}
                                title={t('ads.stats')}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>

                              {/* Edit */}
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditForm(ad)}
                                  title={t('ads.editPlacement')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Delete */}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => { setDeleteAd(ad); setDeleteOpen(true); }}
                                  title={t('ads.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Create/Edit Ad Dialog ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Ad' : t('ads.createAd')}</DialogTitle>
            <DialogDescription>
              {editingAd ? 'Update your ad details' : 'Create a new advertisement'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title & Description */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ad title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ad description"
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>

            {/* Type & Format */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('ads.type')} *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="interstitial">Interstitial</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="native">Native</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="rich_media">Rich Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format *</Label>
                <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="image_base64">Image</SelectItem>
                    <SelectItem value="video_base64">Video</SelectItem>
                    <SelectItem value="text_quill">Rich Text</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div>
              <Label>Content *</Label>
              <div className="mt-1.5">
                {form.format === 'text_quill' ? (
                  <RichTextEditor
                    value={form.content}
                    onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                    level="basic"
                    placeholder="Write your ad content..."
                  />
                ) : form.format === 'image_base64' ? (
                  <ImageUpload
                    value={form.content || null}
                    onChange={(v) => setForm((f) => ({ ...f, content: v || '' }))}
                    type="image"
                    maxDimension={1200}
                    maxSize={5}
                  />
                ) : form.format === 'video_base64' ? (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setForm((f) => ({ ...f, content: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {form.content && (
                      <p className="text-xs text-muted-foreground">Video uploaded successfully</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder={
                      form.format === 'url' ? 'https://example.com/ad-content' :
                      form.format === 'html' ? '<div>Your HTML content</div>' :
                      form.format === 'script' ? '<script src="..."></script>' :
                      'Ad content'
                    }
                    rows={6}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            </div>

            {/* Target URL */}
            <div>
              <Label>Target URL</Label>
              <Input
                value={form.targetUrl}
                onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
                placeholder="https://example.com/landing-page"
                className="mt-1.5"
              />
            </div>

            {/* Plan Selection */}
            <div>
              <Label>{t('ads.plans')} *</Label>
              <Select value={form.planId} onValueChange={(v) => setForm((f) => ({ ...f, planId: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter((p) => p.isActive).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {plan.isFree ? 'Free' : `${plan.price} MZN`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Placements */}
            <div>
              <Label>{t('ads.placement')} *</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {Object.entries(AD_PLACEMENTS).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`ad-placement-${key}`}
                      checked={form.placement.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((f) => ({ ...f, placement: [...f.placement, key] }));
                        } else {
                          setForm((f) => ({ ...f, placement: f.placement.filter((p) => p !== key) }));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor={`ad-placement-${key}`} className="text-xs cursor-pointer">
                      <span className="font-medium">{config.name}</span>
                      <span className="text-muted-foreground ml-1">({config.type})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Max {t('ads.impressions')}</Label>
                <Input
                  type="number"
                  value={form.maxImpressions}
                  onChange={(e) => setForm((f) => ({ ...f, maxImpressions: Number(e.target.value) }))}
                  placeholder="0 = unlimited"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Max {t('ads.clicks')}</Label>
                <Input
                  type="number"
                  value={form.maxClicks}
                  onChange={(e) => setForm((f) => ({ ...f, maxClicks: Number(e.target.value) }))}
                  placeholder="0 = unlimited"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Max {t('ads.conversions')}</Label>
                <Input
                  type="number"
                  value={form.maxConversions}
                  onChange={(e) => setForm((f) => ({ ...f, maxConversions: Number(e.target.value) }))}
                  placeholder="0 = unlimited"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Auto-deactivate */}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.autoDeactivate}
                onCheckedChange={(v) => setForm((f) => ({ ...f, autoDeactivate: v }))}
              />
              <Label>Auto-deactivate when limits reached</Label>
            </div>

            {/* Pixel URLs */}
            <Separator />
            <p className="text-sm font-medium">Tracking Pixels (one URL per line)</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs">Impression Pixels</Label>
                <Textarea
                  value={form.pixelUrls}
                  onChange={(e) => setForm((f) => ({ ...f, pixelUrls: e.target.value }))}
                  placeholder="https://example.com/pixel.gif&#10;https://example.com/pixel2.gif"
                  className="mt-1 text-xs font-mono"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Click Pixels</Label>
                <Textarea
                  value={form.clickPixelUrls}
                  onChange={(e) => setForm((f) => ({ ...f, clickPixelUrls: e.target.value }))}
                  placeholder="https://example.com/click.gif"
                  className="mt-1 text-xs font-mono"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Conversion Pixels</Label>
                <Textarea
                  value={form.conversionPixelUrls}
                  onChange={(e) => setForm((f) => ({ ...f, conversionPixelUrls: e.target.value }))}
                  placeholder="https://example.com/conv.gif"
                  className="mt-1 text-xs font-mono"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('ads.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('ads.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stats Dialog ── */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('ads.stats')}
            </DialogTitle>
            <DialogDescription>
              {statsAd?.title}
            </DialogDescription>
          </DialogHeader>

          {statsAd && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={`capitalize ${getStatusColor(statsAd.status)}`}>
                  {t(`ads.${statsAd.status}`) || statsAd.status}
                </Badge>
                <Badge variant="outline" className="capitalize">{statsAd.type}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('ads.impressions')}</p>
                  <p className="text-xl font-bold">{statsAd.impressions?.toLocaleString() || 0}</p>
                  {statsAd.maxImpressions > 0 && (
                    <p className="text-xs text-muted-foreground">of {statsAd.maxImpressions.toLocaleString()}</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('ads.clicks')}</p>
                  <p className="text-xl font-bold">{statsAd.clicks?.toLocaleString() || 0}</p>
                  {statsAd.maxClicks > 0 && (
                    <p className="text-xs text-muted-foreground">of {statsAd.maxClicks.toLocaleString()}</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('ads.ctr')}</p>
                  <p className="text-xl font-bold">
                    {statsAd.impressions > 0 ? ((statsAd.clicks / statsAd.impressions) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('ads.conversions')}</p>
                  <p className="text-xl font-bold">{statsAd.conversions?.toLocaleString() || 0}</p>
                </div>
              </div>

              {statsAd.rejectedReason && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{t('ads.rejectReason')}:</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{statsAd.rejectedReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ads.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteAd?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ads.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('ads.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
