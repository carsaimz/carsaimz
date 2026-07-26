'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { useAuthStore } from '@/lib/store';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface UserData { id: string; name: string; email: string; role: string; createdAt: string; }

export function AdminUsers() {
  const { t, formatDate } = useLanguage();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users?limit=100&excludeSuperAdmin=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter out super_admin users — they should not be visible in admin UI
          const filteredUsers = (data.data || []).filter((u: UserData) => u.role !== 'super_admin');
          setUsers(filteredUsers);
        } else {
          setError(data.message || 'Failed to load users');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Admin</Badge>;
      case 'partner': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partner</Badge>;
      case 'user': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">User</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) return <motion.div variants={containerVariants} initial="hidden" animate="visible"><Skeleton className="h-64 w-full rounded-xl" /></motion.div>;
  if (error) return <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-500" /><p>{error}</p></div><Button className="mt-4" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />{t('common.retry')}</Button></CardContent></Card>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-emerald-600" />{t('admin.users') || 'Users Management'}</h2>
        <p className="text-muted-foreground mt-1">View and manage all platform users</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>All Users</CardTitle><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{users.length} total</Badge></div></CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? <div className="text-center py-12"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t('common.noData') || 'No users found'}</p></div> :
          <Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
          <TableBody>{users.map((u) => <TableRow key={u.id}><TableCell><div className="flex items-center gap-2"><Avatar className="size-6"><AvatarFallback className="text-xs">{u.name.split(' ').map((n) => n[0]).join('').slice(0,2)}</AvatarFallback></Avatar><span className="font-medium">{u.name}</span></div></TableCell><TableCell className="text-muted-foreground">{u.email}</TableCell><TableCell>{roleBadge(u.role)}</TableCell><TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}
        </CardContent></Card>
      </motion.div>
    </motion.div>
  );
}
