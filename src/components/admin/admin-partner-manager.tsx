'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDocumentTitle } from '@/hooks/use-document-title';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import {
  Briefcase, Eye, Pencil, Plus, Clock, CheckCircle2, XCircle, DollarSign, Link2, Banknote, Tag,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  commissionRate?: number;
  status?: string;
  createdAt: string;
  stats: {
    totalClicks: number;
    totalCommissions: number;
    totalCommissionAmount: number;
    pendingWithdrawals: number;
  };
  withdrawals: any[];
  commissions: any[];
  clicks: any[];
}

export function AdminPartnerManager() {
  const { t, formatDate, formatCurrency } = useLanguage();
  useDocumentTitle('admin.partner', 'Parceiros');
  const { toast } = useToast();

  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerData | null>(null);

  // Commission rate dialog
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [commissionPartner, setCommissionPartner] = useState<PartnerData | null>(null);
  const [commissionRate, setCommissionRate] = useState('');
  const [commissionSaving, setCommissionSaving] = useState(false);

  // Coupon dialog
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponPartner, setCouponPartner] = useState<PartnerData | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponSaving, setCouponSaving] = useState(false);

  // Withdrawal action
  const [withdrawalSaving, setWithdrawalSaving] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/partner');
      const data = await safeJson(res);
      if (data && data.success) {
        setPartners(data.data || []);
      }
    } catch (err) {
      console.error('Partners fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openDetail = (partner: PartnerData) => {
    setSelectedPartner(partner);
    setDetailOpen(true);
  };

  const openCommissionDialog = (partner: PartnerData) => {
    setCommissionPartner(partner);
    setCommissionRate(String(partner.commissionRate || 10));
    setCommissionDialogOpen(true);
  };

  const handleCommissionSave = async () => {
    if (!commissionPartner) return;
    setCommissionSaving(true);
    try {
      const res = await apiFetch('/api/admin/partner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commissionPartner.id,
          commissionRate: parseFloat(commissionRate),
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Updated', description: t('admin.partner') || 'Commission rate updated' });
        setCommissionDialogOpen(false);
        fetchPartners();
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to update', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setCommissionSaving(false);
    }
  };

  const openCouponDialog = (partner: PartnerData) => {
    setCouponPartner(partner);
    setCouponCode('');
    setCouponDiscount('');
    setCouponDescription('');
    setCouponDialogOpen(true);
  };

  const handleCouponCreate = async () => {
    if (!couponPartner || !couponCode || !couponDiscount) return;
    setCouponSaving(true);
    try {
      const res = await apiFetch('/api/admin/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: couponPartner.id,
          code: couponCode,
          discountPercent: couponDiscount,
          description: couponDescription || null,
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Created', description: t('admin.partner') || 'Coupon created' });
        setCouponDialogOpen(false);
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to create coupon', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to create coupon', variant: 'destructive' });
    } finally {
      setCouponSaving(false);
    }
  };

  const handleWithdrawalAction = async (partnerId: string, withdrawalId: string, status: string) => {
    setWithdrawalSaving(withdrawalId);
    try {
      const res = await apiFetch('/api/admin/partner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: partnerId,
          action: 'updateWithdrawal',
          withdrawalId,
          status,
        }),
      });
      const data = await safeJson(res);
      if (data && data.success) {
        toast({ title: t('admin.save') || 'Updated', description: `Withdrawal ${status}` });
        fetchPartners();
        // Refresh selected partner detail
        if (selectedPartner && selectedPartner.id === partnerId) {
          const refreshed = await apiFetch('/api/admin/partner');
          const refreshedData = await safeJson(refreshed);
          if (refreshedData && refreshedData.success) {
            const updated = (refreshedData.data || []).find((p: PartnerData) => p.id === partnerId);
            if (updated) setSelectedPartner(updated);
          }
        }
      } else {
        toast({ title: t('admin.error') || 'Error', description: data?.message || 'Failed to update', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('admin.error') || 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setWithdrawalSaving(null);
    }
  };

  const withdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />{t('common.pending') || 'Pending'}</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.approved') || 'Approved'}</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="h-3 w-3 mr-1" />{t('common.completed') || 'Paid'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />{t('common.rejected') || 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.partner') || 'Partner Management'}
          </h2>
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
            {partners.length} {t('common.total') || 'total'}
          </Badge>
        </div>
      </motion.div>

      {/* Partners Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.partner') || 'Partners'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading') || 'Loading...'}</div>
            ) : partners.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('admin.noItems') || 'No partners'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.name') || 'Name'}</TableHead>
                    <TableHead>{t('admin.userEmail') || 'Email'}</TableHead>
                    <TableHead>{t('partner.commissions') || 'Commissions'}</TableHead>
                    <TableHead>{t('partner.totalClicks') || 'Clicks'}</TableHead>
                    <TableHead>{t('partner.withdrawals') || 'Pending'}</TableHead>
                    <TableHead>{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{partner.email || '—'}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(partner.stats?.totalCommissionAmount || 0)}</TableCell>
                      <TableCell className="text-sm">{partner.stats?.totalClicks || 0}</TableCell>
                      <TableCell>
                        {partner.stats?.pendingWithdrawals > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{partner.stats.pendingWithdrawals}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openDetail(partner)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openCommissionDialog(partner)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="size-8" onClick={() => openCouponDialog(partner)}>
                            <Tag className="size-4" />
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

      {/* Partner Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {selectedPartner?.name || t('admin.partner') || 'Partner Details'}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Partner details'}</DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedPartner && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{selectedPartner.stats?.totalClicks || 0}</p>
                  <p className="text-xs text-muted-foreground">{t('partner.totalClicks') || 'Clicks'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{selectedPartner.stats?.totalCommissions || 0}</p>
                  <p className="text-xs text-muted-foreground">{t('partner.conversions') || 'Conversions'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(selectedPartner.stats?.totalCommissionAmount || 0)}</p>
                  <p className="text-xs text-muted-foreground">{t('partner.commissionsEarned') || 'Earned'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{selectedPartner.commissionRate || 10}%</p>
                  <p className="text-xs text-muted-foreground">{t('partner.commissionRate') || 'Rate'}</p>
                </div>
              </div>

              {/* Pending Withdrawals */}
              {selectedPartner.withdrawals && selectedPartner.withdrawals.filter((w: any) => w.status === 'pending').length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t('partner.withdrawals') || 'Pending Withdrawals'}
                  </h4>
                  <div className="space-y-2">
                    {selectedPartner.withdrawals
                      .filter((w: any) => w.status === 'pending')
                      .map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <span className="text-sm font-medium">{formatCurrency(w.amount)}</span>
                            <span className="text-xs text-muted-foreground ml-2">({w.method || '—'})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                              onClick={() => handleWithdrawalAction(selectedPartner.id, w.id, 'approved')}
                              disabled={withdrawalSaving === w.id}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t('common.approved') || 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => handleWithdrawalAction(selectedPartner.id, w.id, 'rejected')}
                              disabled={withdrawalSaving === w.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              {t('common.rejected') || 'Reject'}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Withdrawals */}
              {selectedPartner.withdrawals && selectedPartner.withdrawals.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">{t('partner.withdrawalHistory') || 'Withdrawal History'}</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedPartner.withdrawals.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatCurrency(w.amount)}</span>
                          <span className="text-xs text-muted-foreground">({w.method || '—'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {withdrawalStatusBadge(w.status)}
                          <span className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Commissions */}
              {selectedPartner.commissions && selectedPartner.commissions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">{t('partner.commissions') || 'Recent Commissions'}</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedPartner.commissions.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">{formatCurrency(c.amount)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('partner.commissionRate') || 'Commission Rate'}</DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Set commission rate for partner'}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('partner.commissionRate') || 'Commission Rate'} (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                className="focus-visible:ring-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>{t('admin.cancel') || 'Cancel'}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCommissionSave} disabled={commissionSaving}>
              {commissionSaving ? 'Saving...' : t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {t('admin.createNew') || 'Create Coupon'}
            </DialogTitle>
            <DialogDescription>{t('admin.contentManager') || 'Create a coupon code for this partner'}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.itemTitle') || 'Coupon Code'}</Label>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="PARTNER10"
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('partner.commissionRate') || 'Discount'} (%)</Label>
              <Input
                type="number"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('admin.description') || 'Description'}</Label>
              <Input
                value={couponDescription}
                onChange={(e) => setCouponDescription(e.target.value)}
                placeholder="Partner discount coupon"
                className="focus-visible:ring-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>{t('admin.cancel') || 'Cancel'}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCouponCreate} disabled={couponSaving}>
              {couponSaving ? 'Saving...' : t('admin.save') || 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
