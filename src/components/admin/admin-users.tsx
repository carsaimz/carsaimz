'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertCircle, RefreshCw, Search, Plus, Pencil, Trash2,
  Loader2, ChevronLeft, ChevronRight, UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/language-context';
import { useAuthStore } from '@/lib/store';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/hooks/use-toast';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

interface EditUserData {
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  bio: string;
  company: string;
  address: string;
}

const PAGE_SIZE = 10;

export function AdminUsers() {
  const { t, formatDate } = useLanguage();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // ── State ──
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Create dialog ──
  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState<CreateUserData>({
    name: '', email: '', password: '', role: 'user', phone: '',
  });
  const [creating, setCreating] = useState(false);

  // ── Edit dialog ──
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editData, setEditData] = useState<EditUserData>({
    name: '', email: '', phone: '', role: 'user', isActive: true, bio: '', company: '', address: '',
  });
  const [editing, setEditing] = useState(false);

  // ── Deactivate ──
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // ── Fetch users ──
  const fetchUsers = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
      });
      if (search) params.set('search', search);

      const res = await apiFetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 1);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchUsers, currentUser?.id]);

  // ── Search debounce ──
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Create user ──
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.userCreated'), description: t('admin.createUserDesc') });
        setCreateOpen(false);
        setCreateData({ name: '', email: '', password: '', role: 'user', phone: '' });
        fetchUsers(currentPage, searchQuery);
      } else {
        toast({ title: t('admin.error') || 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('admin.error') || 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ── Edit user ──
  const handleEdit = async () => {
    if (!editUser) return;
    setEditing(true);
    try {
      const res = await apiFetch(`/api/admin/users?id=${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.userUpdated'), description: t('admin.editUserDesc') });
        setEditOpen(false);
        setEditUser(null);
        fetchUsers(currentPage, searchQuery);
      } else {
        toast({ title: t('admin.error') || 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('admin.error') || 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  // ── Deactivate user ──
  const handleDeactivate = async (userId: string) => {
    setDeactivatingId(userId);
    try {
      const res = await apiFetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.userDeactivated') });
        fetchUsers(currentPage, searchQuery);
      } else {
        toast({ title: t('admin.error') || 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('admin.error') || 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeactivatingId(null);
    }
  };

  // ── Activate user (re-enable via PUT) ──
  const handleActivate = async (userId: string) => {
    setDeactivatingId(userId);
    try {
      const res = await apiFetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.userUpdated') });
        fetchUsers(currentPage, searchQuery);
      } else {
        toast({ title: t('admin.error') || 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('admin.error') || 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeactivatingId(null);
    }
  };

  // ── Role badge ──
  const roleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Super Admin</Badge>;
      case 'admin': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Admin</Badge>;
      case 'partner': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partner</Badge>;
      case 'user': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">User</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  // ── Status badge ──
  const statusBadge = (isActive?: boolean) => {
    if (isActive === false) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">{t('admin.userInactive') || 'Inactivo'}</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('admin.userActive') || 'Activo'}</Badge>;
  };

  // ── Open edit dialog ──
  const openEdit = (u: UserData) => {
    setEditUser(u);
    setEditData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      isActive: u.isActive !== false,
      bio: (u as any).bio || '',
      company: (u as any).company || '',
      address: (u as any).address || '',
    });
    setEditOpen(true);
  };

  // ── Error state ──
  if (error && !loading) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p>{error}</p>
            </div>
            <Button className="mt-4" onClick={() => fetchUsers(currentPage, searchQuery)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              {t('admin.users') || 'Users Management'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {total} {t('admin.usersTotal') || 'total users'}
            </p>
          </div>

          {/* ── Create user button ── */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <UserPlus className="h-4 w-4" />
                {t('admin.createUser') || 'Create User'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('admin.createUser') || 'Create User'}</DialogTitle>
                <DialogDescription>{t('admin.createUserDesc') || 'Create a new platform user'}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">{t('admin.userName') || 'Name'}</Label>
                  <Input
                    id="create-name"
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-email">{t('admin.userEmail') || 'Email'}</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createData.email}
                    onChange={(e) => setCreateData(prev => ({ ...prev, email: e.target.value }))}
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-password">{t('admin.userPassword') || 'Password'}</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createData.password}
                    onChange={(e) => setCreateData(prev => ({ ...prev, password: e.target.value }))}
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-phone">{t('admin.userPhone') || 'Phone'}</Label>
                  <Input
                    id="create-phone"
                    value={createData.phone}
                    onChange={(e) => setCreateData(prev => ({ ...prev, phone: e.target.value }))}
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('admin.userRole') || 'Role'}</Label>
                  <Select
                    value={createData.role}
                    onValueChange={(val) => setCreateData(prev => ({ ...prev, role: val }))}
                  >
                    <SelectTrigger className="focus:ring-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  {t('admin.cancel') || 'Cancel'}
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreate}
                  disabled={creating || !createData.name || !createData.email || !createData.password}
                >
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t('admin.createUser') || 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Search ── */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchUsers') || 'Search users...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 focus-visible:ring-emerald-500"
          />
        </div>
      </motion.div>

      {/* ── Users table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('common.noData') || 'No users found'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50">
                    <TableHead>{t('admin.userName') || 'Name'}</TableHead>
                    <TableHead>{t('admin.userEmail') || 'Email'}</TableHead>
                    <TableHead>{t('admin.userPhone') || 'Phone'}</TableHead>
                    <TableHead>{t('admin.userRole') || 'Role'}</TableHead>
                    <TableHead>{t('admin.userStatus') || 'Status'}</TableHead>
                    <TableHead>{t('admin.date') || 'Date'}</TableHead>
                    <TableHead className="text-right">{t('admin.actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-xs">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-muted-foreground">{u.phone || '—'}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>{statusBadge(u.isActive)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(u)}
                          >
                            <Pencil className="h-4 w-4 text-emerald-600" />
                          </Button>

                          {/* Deactivate / Activate button */}
                          {u.isActive === false ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleActivate(u.id)}
                              disabled={deactivatingId === u.id}
                            >
                              {deactivatingId === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 text-emerald-600" />
                              )}
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('admin.deactivateUser') || 'Deactivate User'}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('admin.confirmDeactivate') || 'Are you sure you want to deactivate this user?'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('admin.cancel') || 'Cancel'}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleDeactivate(u.id)}
                                  >
                                    {t('admin.deactivateUser') || 'Deactivate'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Edit user dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('admin.editUser') || 'Edit User'}</DialogTitle>
            <DialogDescription>{t('admin.editUserDesc') || 'Update user information'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('admin.userName') || 'Name'}</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">{t('admin.userEmail') || 'Email'}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">{t('admin.userPhone') || 'Phone'}</Label>
              <Input
                id="edit-phone"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company">{t('dashboard.company') || 'Company'}</Label>
              <Input
                id="edit-company"
                value={editData.company}
                onChange={(e) => setEditData(prev => ({ ...prev, company: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bio">{t('dashboard.bio') || 'Bio'}</Label>
              <Input
                id="edit-bio"
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">{t('dashboard.address') || 'Address'}</Label>
              <Input
                id="edit-address"
                value={editData.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>{t('admin.userRole') || 'Role'}</Label>
              <Select
                value={editData.role}
                onValueChange={(val) => setEditData(prev => ({ ...prev, role: val }))}
              >
                <SelectTrigger className="focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('admin.userStatus') || 'Status'}</Label>
              <Select
                value={editData.isActive ? 'active' : 'inactive'}
                onValueChange={(val) => setEditData(prev => ({ ...prev, isActive: val === 'active' }))}
              >
                <SelectTrigger className="focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('admin.userActive') || 'Active'}</SelectItem>
                  <SelectItem value="inactive">{t('admin.userInactive') || 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t('admin.cancel') || 'Cancel'}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEdit}
              disabled={editing}
            >
              {editing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
              {t('admin.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
