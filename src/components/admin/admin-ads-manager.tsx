'use client';

/**
 * Carsai Mozambique — Admin Ads Manager
 *
 * Comprehensive admin page for managing ads:
 * - Table view of all ads with filtering by status, type, partner
 * - Approve/reject buttons with reject reason dialog
 * - View ad details (content preview, stats, placement info)
 * - Edit ad placement (choose where ad appears)
 * - Pause/resume active ads
 * - Delete ads
 * - Stats display (impressions, clicks, CTR, conversions)
 * - Ad plans management (tab with plan CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { useAuthStore } from '@/lib/store';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { AD_PLACEMENTS, getPlacementName, type AdPlacementId } from '@/lib/ad-placements';
import { resolveI18nContent } from '@/lib/i18n-content';
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
  Eye, CheckCircle2, XCircle, Pause, Play, Trash2, Pencil,
  BarChart3, LayoutGrid, DollarSign, Plus, Megaphone, ExternalLink,
  MousePointerClick, Target, TrendingUp,
} from 'lucide-react';
import { sanitizeQuillHtml } from '@/lib/sanitize-html';

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
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdPlanData {
  id: string;
  name: string;
  nameI18n?: string;
  description: string;
  descriptionI18n?: string;
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
  order: number;
}

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

export function AdminAdsManager() {
  const { t, formatDate, formatCurrency, language } = useLanguage();
  useDocumentTitle('ads.title', 'Anúncios');
  const { toast } = useToast();
  const { user, idToken } = useAuthStore();

  // ── State ──
  const [ads, setAds] = useState<AdData[]>([]);
  const [plans, setPlans] = useState<AdPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ads');

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectAd, setRejectAd] = useState<AdData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Edit placement dialog
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placementAd, setPlacementAd] = useState<AdData | null>(null);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [placementSaving, setPlacementSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAd, setDeleteAd] = useState<AdData | null>(null);

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdPlanData | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    nameI18n: '',
    description: '',
    descriptionI18n: '',
    price: 0,
    isFree: false,
    isActive: true,
    order: 0,
    features: {
      maxAds: 1,
      maxImpressions: 1000,
      placements: [] as string[],
      formats: [] as string[],
      customBranding: false,
      analytics: false,
      priority: 50,
      supportLevel: 'community',
    },
  });
  const [planSaving, setPlanSaving] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // ── Fetch ads ──
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/admin/ads?limit=100';
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;

      const res = await apiFetch(url, {
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
  }, [idToken, filterStatus, filterType, toast]);

  // ── Fetch plans ──
  const fetchPlans = useCallback(async () => {
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
  }, [fetchAds]);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    }
  }, [activeTab, fetchPlans]);

  // ── Actions ──

  const handleApprove = async (ad: AdData) => {
    setActionLoading((prev) => ({ ...prev, [ad.id]: true }));
    try {
      const res = await apiFetch(`/api/ads/${ad.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: t('ads.approve'), description: 'Ad approved successfully' });
        fetchAds();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to approve ad', variant: 'destructive' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [ad.id]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectAd || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      const res = await apiFetch(`/api/ads/${rejectAd.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: t('ads.reject'), description: 'Ad rejected' });
        setRejectOpen(false);
        setRejectReason('');
        setRejectAd(null);
        fetchAds();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reject ad', variant: 'destructive' });
    } finally {
      setRejecting(false);
    }
  };

  const handlePauseResume = async (ad: AdData) => {
    const newStatus = ad.status === 'paused' ? 'active' : 'paused';
    setActionLoading((prev) => ({ ...prev, [ad.id]: true }));
    try {
      const res = await apiFetch(`/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: newStatus === 'active' ? t('ads.resume') : t('ads.pause'), description: `Ad ${newStatus}` });
        fetchAds();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update ad', variant: 'destructive' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [ad.id]: false }));
    }
  };

  const handleDelete = async () => {
    if (!deleteAd) return;
    try {
      const res = await apiFetch(`/api/ads/${deleteAd.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: t('ads.delete'), description: 'Ad deleted' });
        setDeleteOpen(false);
        setDeleteAd(null);
        fetchAds();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete ad', variant: 'destructive' });
    }
  };

  const handleSavePlacement = async () => {
    if (!placementAd) return;
    setPlacementSaving(true);
    try {
      const res = await apiFetch(`/api/ads/${placementAd.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ placement: selectedPlacements }),
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: t('ads.editPlacement'), description: 'Placement updated' });
        setPlacementOpen(false);
        setPlacementAd(null);
        fetchAds();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update placement', variant: 'destructive' });
    } finally {
      setPlacementSaving(false);
    }
  };

  // ── Plan actions ──

  const handleSavePlan = async () => {
    setPlanSaving(true);
    try {
      const url = editingPlan ? '/api/admin/ads/plans' : '/api/admin/ads/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { ...planForm, id: editingPlan.id } : planForm;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await safeJson<{ success: boolean }>(res);
      if (data?.success) {
        toast({ title: t('ads.save'), description: editingPlan ? 'Plan updated' : 'Plan created' });
        setPlanDialogOpen(false);
        setEditingPlan(null);
        resetPlanForm();
        fetchPlans();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' });
    } finally {
      setPlanSaving(false);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      nameI18n: '',
      description: '',
      descriptionI18n: '',
      price: 0,
      isFree: false,
      isActive: true,
      order: 0,
      features: {
        maxAds: 1,
        maxImpressions: 1000,
        placements: [],
        formats: [],
        customBranding: false,
        analytics: false,
        priority: 50,
        supportLevel: 'community',
      },
    });
  };

  const openEditPlan = (plan: AdPlanData) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      nameI18n: plan.nameI18n || '',
      description: plan.description,
      descriptionI18n: plan.descriptionI18n || '',
      price: plan.price,
      isFree: plan.isFree,
      isActive: plan.isActive,
      order: plan.order,
      features: { ...plan.features },
    });
    setPlanDialogOpen(true);
  };

  const openNewPlan = () => {
    setEditingPlan(null);
    resetPlanForm();
    setPlanDialogOpen(true);
  };

  // ── Computed stats ──
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalConversions = ads.reduce((sum, a) => sum + (a.conversions || 0), 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const pendingCount = ads.filter((a) => a.status === 'pending').length;
  const activeCount = ads.filter((a) => a.status === 'active').length;

  // ── Render ──
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          {t('ads.title')}
        </h1>
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

      {/* Pending / Active count */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
          {t('ads.pending')}: {pendingCount}
        </Badge>
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          {t('ads.active')}: {activeCount}
        </Badge>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ads" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              {t('ads.title')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5">
              <DollarSign className="h-4 w-4" />
              {t('ads.plans')}
            </TabsTrigger>
          </TabsList>

          {/* ── Ads Tab ── */}
          <TabsContent value="ads" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('ads.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('ads.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('ads.pending')}</SelectItem>
                  <SelectItem value="approved">{t('ads.approved')}</SelectItem>
                  <SelectItem value="active">{t('ads.active')}</SelectItem>
                  <SelectItem value="paused">{t('ads.paused')}</SelectItem>
                  <SelectItem value="rejected">{t('ads.rejected')}</SelectItem>
                  <SelectItem value="expired">{t('ads.expired')}</SelectItem>
                  <SelectItem value="completed">{t('ads.completed')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('ads.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('ads.allTypes')}</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="interstitial">Interstitial</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="rich_media">Rich Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ads Table */}
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
                          return (
                            <TableRow key={ad.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {ad.title}
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
                                      {getPlacementName(p, t) || p}
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
                                  {/* View Detail */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => { setSelectedAd(ad); setDetailOpen(true); }}
                                    title={t('ads.detail')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {/* Approve */}
                                  {(ad.status === 'pending' || ad.status === 'rejected') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                      onClick={() => handleApprove(ad)}
                                      disabled={actionLoading[ad.id]}
                                      title={t('ads.approve')}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Reject */}
                                  {(ad.status === 'pending' || ad.status === 'approved' || ad.status === 'active') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      onClick={() => { setRejectAd(ad); setRejectOpen(true); }}
                                      title={t('ads.reject')}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Pause/Resume */}
                                  {(ad.status === 'active' || ad.status === 'paused') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handlePauseResume(ad)}
                                      disabled={actionLoading[ad.id]}
                                      title={ad.status === 'active' ? t('ads.pause') : t('ads.resume')}
                                    >
                                      {ad.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                  )}

                                  {/* Edit Placement */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setPlacementAd(ad);
                                      setSelectedPlacements(ad.placement || []);
                                      setPlacementOpen(true);
                                    }}
                                    title={t('ads.editPlacement')}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  {/* Delete */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => { setDeleteAd(ad); setDeleteOpen(true); }}
                                    title={t('ads.delete')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
          </TabsContent>

          {/* ── Plans Tab ── */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openNewPlan} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('ads.createAd')}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{resolveI18nContent(plan.nameI18n, plan.name, language)}</CardTitle>
                      <Badge variant={plan.isFree ? 'secondary' : 'default'} className="text-xs">
                        {plan.isFree ? t('ads.free') : formatCurrency(plan.price)}
                      </Badge>
                    </div>
                    {(plan.description || plan.descriptionI18n) && (
                      <p className="text-sm text-muted-foreground">{resolveI18nContent(plan.descriptionI18n, plan.description, language)}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">{t('ads.adsCount', { count: '' }).trim() || 'Ads'}:</span> {plan.features.maxAds || '∞'}</div>
                      <div><span className="text-muted-foreground">{t('ads.impressions')}:</span> {plan.features.maxImpressions || '∞'}</div>
                      <div><span className="text-muted-foreground">{t('ads.priority')}:</span> {plan.features.priority}</div>
                      <div><span className="text-muted-foreground">{t('ads.supportLevel')}:</span> {plan.features.supportLevel}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.formats?.map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)} className="gap-1">
                        <Pencil className="h-3 w-3" />
                        {t('ads.editPlacement')}
                      </Button>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'} className="text-xs">
                        {plan.isActive ? t('ads.active') : t('ads.paused')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('ads.detail')}
            </DialogTitle>
            <DialogDescription>
              {selectedAd?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="space-y-4">
              {/* Status & Type */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`capitalize ${getStatusColor(selectedAd.status)}`}>
                  {t(`ads.${selectedAd.status}`) || selectedAd.status}
                </Badge>
                <Badge variant="outline" className="capitalize">{selectedAd.type}</Badge>
                <Badge variant="outline" className="capitalize">{selectedAd.format}</Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('ads.impressions')}</p>
                  <p className="text-lg font-bold">{selectedAd.impressions?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('ads.clicks')}</p>
                  <p className="text-lg font-bold">{selectedAd.clicks?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('ads.ctr')}</p>
                  <p className="text-lg font-bold">
                    {selectedAd.impressions > 0 ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('ads.conversions')}</p>
                  <p className="text-lg font-bold">{selectedAd.conversions?.toLocaleString() || 0}</p>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('ads.placement')}:</span>
                  <span className="flex flex-wrap gap-1 justify-end">
                    {selectedAd.placement?.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {getPlacementName(p, t) || p}
                      </Badge>
                    ))}
                  </span>
                </div>
                {selectedAd.targetUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target URL:</span>
                    <a href={selectedAd.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs max-w-[250px] truncate">
                      {selectedAd.targetUrl}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
                {selectedAd.rejectedReason && (
                  <div>
                    <span className="text-muted-foreground">{t('ads.rejectReason')}:</span>
                    <p className="text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                      {selectedAd.rejectedReason}
                    </p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max {t('ads.impressions')}:</span>
                  <span>{selectedAd.maxImpressions || '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max {t('ads.clicks')}:</span>
                  <span>{selectedAd.maxClicks || '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-deactivate:</span>
                  <span>{selectedAd.autoDeactivate ? 'Yes' : 'No'}</span>
                </div>
                {selectedAd.startDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{formatDate(selectedAd.startDate)}</span>
                  </div>
                )}
                {selectedAd.endDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End:</span>
                    <span>{formatDate(selectedAd.endDate)}</span>
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Content Preview</p>
                <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                  {selectedAd.format === 'image_base64' ? (
                    <img
                      src={selectedAd.content.startsWith('data:') ? selectedAd.content : `data:image/png;base64,${selectedAd.content}`}
                      alt={selectedAd.title}
                      className="max-w-full h-auto"
                    />
                  ) : selectedAd.format === 'text_quill' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeQuillHtml(selectedAd.content) }} />
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap break-all">{selectedAd.content?.slice(0, 500)}{selectedAd.content?.length > 500 ? '...' : ''}</pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {t('ads.reject')}
            </DialogTitle>
            <DialogDescription>
              {rejectAd?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('ads.rejectReason')}</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="mt-1.5"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectOpen(false); setRejectReason(''); }}>
              {t('ads.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejecting}
            >
              {rejecting ? '...' : t('ads.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Placement Dialog ── */}
      <Dialog open={placementOpen} onOpenChange={setPlacementOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {t('ads.editPlacement')}
            </DialogTitle>
            <DialogDescription>
              {placementAd?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(AD_PLACEMENTS).map(([key, config]) => (
              <div key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <input
                  type="checkbox"
                  id={`placement-${key}`}
                  checked={selectedPlacements.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlacements((prev) => [...prev, key]);
                    } else {
                      setSelectedPlacements((prev) => prev.filter((p) => p !== key));
                    }
                  }}
                  className="rounded border-border"
                />
                <label htmlFor={`placement-${key}`} className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium">{getPlacementName(key, t)}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </label>
                <Badge variant="outline" className="text-[10px]">{config.type}</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlacementOpen(false)}>
              {t('ads.cancel')}
            </Button>
            <Button onClick={handleSavePlacement} disabled={selectedPlacements.length === 0 || placementSaving}>
              {placementSaving ? '...' : t('ads.save')}
            </Button>
          </DialogFooter>
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

      {/* ── Plan Dialog ── */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? t('ads.editPlacement') : t('ads.createAd')}</DialogTitle>
            <DialogDescription>
              {editingPlan ? t('ads.save') : t('ads.createAdDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('ads.planName')}</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Plan name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('ads.planPrice')} (MZN)</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>{t('ads.planFeatures')}</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={language === 'pt-pt' ? 'Descrição do plano' : 'Plan description'}
                className="mt-1.5"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('ads.planName')} i18n (JSON)</Label>
              <Textarea
                value={planForm.nameI18n || ''}
                onChange={(e) => setPlanForm((p) => ({ ...p, nameI18n: e.target.value }))}
                placeholder='{"en-us":"Name","fr-fr":"Nom",...}'
                className="mt-1.5 font-mono text-xs"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('ads.planFeatures')} i18n (JSON)</Label>
              <Textarea
                value={planForm.descriptionI18n || ''}
                onChange={(e) => setPlanForm((p) => ({ ...p, descriptionI18n: e.target.value }))}
                placeholder='{"en-us":"Description","fr-fr":"Description",...}'
                className="mt-1.5 font-mono text-xs"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max {t('ads.title')}</Label>
                <Input
                  type="number"
                  value={planForm.features.maxAds}
                  onChange={(e) => setPlanForm((p) => ({ ...p, features: { ...p.features, maxAds: Number(e.target.value) } }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('ads.maxImpressions')}</Label>
                <Input
                  type="number"
                  value={planForm.features.maxImpressions}
                  onChange={(e) => setPlanForm((p) => ({ ...p, features: { ...p.features, maxImpressions: Number(e.target.value) } }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('ads.priority')}</Label>
                <Input
                  type="number"
                  value={planForm.features.priority}
                  onChange={(e) => setPlanForm((p) => ({ ...p, features: { ...p.features, priority: Number(e.target.value) } }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('ads.supportLevel')}</Label>
                <Select
                  value={planForm.features.supportLevel}
                  onValueChange={(v) => setPlanForm((p) => ({ ...p, features: { ...p.features, supportLevel: v } }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dedicated">Dedicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.isFree}
                  onCheckedChange={(v) => setPlanForm((p) => ({ ...p, isFree: v }))}
                />
                <Label>{t('ads.free')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.isActive}
                  onCheckedChange={(v) => setPlanForm((p) => ({ ...p, isActive: v }))}
                />
                <Label>{t('ads.active')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.features.customBranding}
                  onCheckedChange={(v) => setPlanForm((p) => ({ ...p, features: { ...p.features, customBranding: v } }))}
                />
                <Label>{t('ads.customBranding')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.features.analytics}
                  onCheckedChange={(v) => setPlanForm((p) => ({ ...p, features: { ...p.features, analytics: v } }))}
                />
                <Label>{t('ads.analytics')}</Label>
              </div>
            </div>

            {/* Placements */}
            <div>
              <Label className="mb-2 block">{t('ads.availablePlacements')}</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {Object.entries(AD_PLACEMENTS).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`plan-placement-${key}`}
                      checked={planForm.features.placements.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlanForm((p) => ({ ...p, features: { ...p.features, placements: [...p.features.placements, key] } }));
                        } else {
                          setPlanForm((p) => ({ ...p, features: { ...p.features, placements: p.features.placements.filter((pl) => pl !== key) } }));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor={`plan-placement-${key}`} className="text-xs cursor-pointer">
                      {getPlacementName(key, t)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div>
              <Label className="mb-2 block">{t('ads.availableFormats')}</Label>
              <div className="flex flex-wrap gap-2">
                {['html', 'script', 'image_base64', 'video_base64', 'text_quill', 'url'].map((fmt) => (
                  <div key={fmt} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`plan-format-${fmt}`}
                      checked={planForm.features.formats.includes(fmt)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlanForm((p) => ({ ...p, features: { ...p.features, formats: [...p.features.formats, fmt] } }));
                        } else {
                          setPlanForm((p) => ({ ...p, features: { ...p.features, formats: p.features.formats.filter((f) => f !== fmt) } }));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor={`plan-format-${fmt}`} className="text-xs cursor-pointer">{fmt}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('ads.priority')}</Label>
              <Input
                type="number"
                value={planForm.order}
                onChange={(e) => setPlanForm((p) => ({ ...p, order: Number(e.target.value) }))}
                className="mt-1.5 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              {t('ads.cancel')}
            </Button>
            <Button onClick={handleSavePlan} disabled={!planForm.name || planSaving}>
              {planSaving ? '...' : t('ads.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
