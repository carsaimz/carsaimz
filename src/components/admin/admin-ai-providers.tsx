'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Save,
  ArrowUp,
  ArrowDown,
  Zap,
  Shield,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, safeJson } from '@/lib/api-fetch';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface ProviderInfo {
  id: string;
  name: string;
  displayName: string | null;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
  priority: number;
  isActive: boolean;
  config: string | null;
}

const PRESET_PROVIDERS = [
  { name: 'groq', displayName: 'Groq (Llama 3.3 70B)', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'deepseek', displayName: 'DeepSeek Chat', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'gemini', displayName: 'Google Gemini Flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  { name: 'openrouter', displayName: 'OpenRouter (Auto)', baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/auto' },
  { name: 'openai', displayName: 'OpenAI GPT-4o Mini', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
];

interface EditFormState {
  displayName: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  priority: number;
  isActive: boolean;
}

export function AdminAiProviders() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderInfo | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    displayName: '',
    apiKey: '',
    baseUrl: '',
    model: '',
    priority: 10,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    displayName: '',
    apiKey: '',
    baseUrl: '',
    model: '',
    priority: 10,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/ai-providers');
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('Fetch providers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await safeJson(res);
      if (!data) { toast({ title: t('common.error') || 'Erro', description: 'Server returned non-JSON response', variant: 'destructive' }); return; }
      if (data.success) {
        toast({
          title: t('common.success') || 'Sucesso',
          description: t('aiProviders.providerAdded') || `${addForm.name} adicionado com sucesso`,
        });
        setAddForm({ name: '', displayName: '', apiKey: '', baseUrl: '', model: '', priority: 10 });
        setShowAddForm(false);
        fetchProviders();
      } else {
        toast({ title: t('common.error') || 'Erro', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: t('common.error') || 'Erro',
        description: t('aiProviders.addFailed') || 'Falha ao adicionar provedor',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('aiProviders.confirmDelete') || 'Tem certeza que deseja remover este provedor?')) return;
    try {
      const res = await apiFetch(`/api/admin/ai-providers?id=${id}`, { method: 'DELETE' });
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        toast({ title: t('aiProviders.providerRemoved') || 'Provedor removido' });
        fetchProviders();
      }
    } catch (err) {
      toast({
        title: t('common.error') || 'Erro',
        description: t('aiProviders.removeFailed') || 'Falha ao remover',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) {
        toast({
          title: isActive
            ? (t('aiProviders.providerActivated') || 'Provedor activado')
            : (t('aiProviders.providerDeactivated') || 'Provedor desactivado'),
        });
        fetchProviders();
      }
    } catch (err) {
      toast({ title: t('common.error') || 'Erro', variant: 'destructive' });
    }
  };

  const handlePriority = async (id: string, newPriority: number) => {
    try {
      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, priority: newPriority }),
      });
      const data = await safeJson(res);
      if (!data) return;
      if (data.success) fetchProviders();
    } catch (err) {
      toast({ title: t('common.error') || 'Erro', variant: 'destructive' });
    }
  };

  const openEditDialog = (provider: ProviderInfo) => {
    setEditingProvider(provider);
    setEditForm({
      displayName: provider.displayName || '',
      // The API returns masked API keys (e.g. "...abcd"). Don't pre-fill the
      // field with the masked value — leave empty as a placeholder so the
      // user knows they need to paste a new key only if they want to change it.
      apiKey: '',
      baseUrl: provider.baseUrl || '',
      model: provider.model || '',
      priority: provider.priority ?? 10,
      isActive: provider.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProvider) return;
    setSaving(true);
    try {
      // Build update payload. Only include apiKey if the user typed something
      // new — otherwise the masked value would be saved back, breaking auth.
      const update: Record<string, any> = {
        id: editingProvider.id,
        displayName: editForm.displayName,
        baseUrl: editForm.baseUrl,
        model: editForm.model,
        priority: editForm.priority,
        isActive: editForm.isActive,
      };
      if (editForm.apiKey.trim() !== '') {
        update.apiKey = editForm.apiKey.trim();
      }

      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      const data = await safeJson(res);
      if (data?.success) {
        toast({
          title: t('common.success') || 'Sucesso',
          description: t('aiProviders.providerUpdated') || 'Provedor actualizado com sucesso',
        });
        setEditingProvider(null);
        fetchProviders();
      } else {
        toast({
          title: t('common.error') || 'Erro',
          description: data?.error || (t('aiProviders.updateFailed') || 'Falha ao actualizar'),
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: t('common.error') || 'Erro',
        description: t('aiProviders.updateFailed') || 'Falha ao actualizar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_PROVIDERS[number]) => {
    setAddForm({
      name: preset.name,
      displayName: preset.displayName,
      apiKey: '',
      baseUrl: preset.baseUrl,
      model: preset.model,
      priority: providers.length + 1,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-red-600" />
          {t('admin.aiProviders') || 'Provedores de IA'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('aiProviders.description') || 'Configure provedores de IA para o chatbot. Se um falhar, o próximo na lista assume automaticamente (failover).'}
        </p>
      </motion.div>

      {/* ── Getting Started Guide (when no providers) ── */}
      {providers.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Zap className="size-4" />
                {t('aiProviders.noProvider') || 'Nenhum provedor configurado'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('aiProviders.noProviderDesc') || 'O chatbot não funciona sem pelo menos um provedor de IA. Recomendamos o Groq — é gratuito e rápido.'}
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                <li>{t('aiProviders.step1') || 'Clique em "Adicionar Provedor" abaixo'}</li>
                <li>{t('aiProviders.step2') || 'Seleccione "Groq (Llama 3.3 70B)" no preenchimento rápido'}</li>
                <li>{t('aiProviders.step3') || 'Obtenha uma API key gratuita em'}{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">console.groq.com</a>
                </li>
                <li>{t('aiProviders.step4') || 'Cole a API key e guarde — o chatbot fica activo imediatamente!'}</li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── External Providers List ── */}
      {providers.map((provider) => (
        <motion.div key={provider.id} variants={itemVariants}>
          <Card className={`${provider.isActive ? 'border-blue-200/60 dark:border-blue-800/60' : 'border-muted opacity-60'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full ${provider.isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'} flex items-center justify-center shrink-0`}>
                  <Bot className={`size-5 ${provider.isActive ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{provider.displayName || provider.name}</span>
                    <Badge variant="outline" className="text-xs">{provider.name}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {t('aiProviders.priority') || 'Prioridade'}: {provider.priority}
                    </Badge>
                    <Badge variant={provider.isActive ? 'default' : 'secondary'} className={`text-xs ${provider.isActive ? 'bg-blue-600 text-white' : ''}`}>
                      {provider.isActive
                        ? (t('common.active') || 'Activo')
                        : (t('common.inactive') || 'Inactivo')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('aiProviders.model') || 'Modelo'}: {provider.model || 'N/A'} | Base URL: {provider.baseUrl || 'N/A'}
                  </p>
                  {provider.apiKey && (
                    <p className="text-xs text-muted-foreground">
                      API Key: {provider.apiKey}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePriority(provider.id, provider.priority - 1)}
                    title={t('aiProviders.increasePriority') || 'Subir prioridade'}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePriority(provider.id, provider.priority + 1)}
                    title={t('aiProviders.decreasePriority') || 'Descer prioridade'}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  {/* ── EDIT button — opens dialog with all fields ── */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(provider)}
                    title={t('common.edit') || 'Editar'}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(provider.id, !provider.isActive)}
                    title={provider.isActive
                      ? (t('aiProviders.deactivate') || 'Desactivar')
                      : (t('aiProviders.activate') || 'Activar')}
                  >
                    {provider.isActive
                      ? <ToggleRight className="size-4 text-green-500" />
                      : <ToggleLeft className="size-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(provider.id)}
                    title={t('common.delete') || 'Remover'}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* ── Add Provider Button ── */}
      <motion.div variants={itemVariants}>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="size-4" />
          {t('aiProviders.addProvider') || 'Adicionar Provedor'}
        </Button>
      </motion.div>

      {/* ── Add Provider Form ── */}
      {showAddForm && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t('aiProviders.newProvider') || 'Novo Provedor de IA'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset quick-select */}
              <div className="space-y-2">
                <Label>{t('aiProviders.presetProviders') || 'Provedores predefinidos (clique para preencher)'}</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_PROVIDERS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.displayName}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">{t('aiProviders.name') || 'Nome (identificador)'}</Label>
                  <Input
                    id="add-name"
                    placeholder="groq, deepseek, gemini..."
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-displayName">{t('aiProviders.displayName') || 'Nome visível'}</Label>
                  <Input
                    id="add-displayName"
                    placeholder="Groq (Llama 3.3 70B)"
                    value={addForm.displayName}
                    onChange={(e) => setAddForm(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-apiKey">API Key</Label>
                  <Input
                    id="add-apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={addForm.apiKey}
                    onChange={(e) => setAddForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-baseUrl">Base URL</Label>
                  <Input
                    id="add-baseUrl"
                    placeholder="https://api.groq.com/openai/v1"
                    value={addForm.baseUrl}
                    onChange={(e) => setAddForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-model">{t('aiProviders.model') || 'Modelo'}</Label>
                  <Input
                    id="add-model"
                    placeholder="llama-3.3-70b-versatile"
                    value={addForm.model}
                    onChange={(e) => setAddForm(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-priority">
                    {t('aiProviders.priority') || 'Prioridade'} (0 = {t('aiProviders.first') || 'primeiro'})
                  </Label>
                  <Input
                    id="add-priority"
                    type="number"
                    value={addForm.priority}
                    onChange={(e) => setAddForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleAdd}>
                  <Save className="size-4" />
                  {t('common.add') || 'Adicionar'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  {t('common.cancel') || 'Cancelar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Edit Provider Dialog ── */}
      <Dialog open={!!editingProvider} onOpenChange={(open) => { if (!open) setEditingProvider(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="size-5 text-blue-600" />
              {t('aiProviders.editProvider') || 'Editar Provedor'}
              {editingProvider && (
                <Badge variant="outline" className="ml-2 text-xs">{editingProvider.name}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('aiProviders.editProviderDesc') || 'Actualize as configurações do provedor. Deixe o campo API Key vazio para manter a chave actual.'}
            </DialogDescription>
          </DialogHeader>

          {editingProvider && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-displayName">{t('aiProviders.displayName') || 'Nome visível'}</Label>
                  <Input
                    id="edit-displayName"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-apiKey" className="flex items-center gap-1.5">
                    <KeyRound className="size-3.5" />
                    API Key
                  </Label>
                  <Input
                    id="edit-apiKey"
                    type="password"
                    placeholder={editingProvider.apiKey
                      ? `${t('aiProviders.apiKeyKeepHint') || 'Mantenha vazio para manter a chave actual'} (${editingProvider.apiKey})`
                      : 'sk-...'
                    }
                    value={editForm.apiKey}
                    onChange={(e) => setEditForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('aiProviders.apiKeyHelp') || 'A chave actual está mascarada por segurança. Cole uma nova chave apenas se quiser substituir.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-baseUrl">Base URL</Label>
                  <Input
                    id="edit-baseUrl"
                    value={editForm.baseUrl}
                    onChange={(e) => setEditForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model">{t('aiProviders.model') || 'Modelo'}</Label>
                  <Input
                    id="edit-model"
                    value={editForm.model}
                    onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">
                    {t('aiProviders.priority') || 'Prioridade'} (0 = {t('aiProviders.first') || 'primeiro'})
                  </Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                <div className="flex items-center justify-between md:col-span-2 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-isActive" className="cursor-pointer">
                      {t('aiProviders.activeProvider') || 'Provedor Activo'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {editForm.isActive
                        ? (t('aiProviders.activeDesc') || 'Provedor será usado pelo chatbot')
                        : (t('aiProviders.inactiveDesc') || 'Provedor não será usado pelo chatbot')}
                    </p>
                  </div>
                  <Switch
                    id="edit-isActive"
                    checked={editForm.isActive}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setEditingProvider(null)}>
                  {t('common.cancel') || 'Cancelar'}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving
                    ? (t('common.saving') || 'A guardar...')
                    : (t('common.save') || 'Guardar')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Failover Explanation ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="size-4 text-green-500" />
              {t('aiProviders.failoverSystem') || 'Sistema de Failover'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('aiProviders.failoverDesc') || 'Quando um utilizador envia uma mensagem, o chatbot tenta os provedores em ordem de prioridade (número menor = tentado primeiro). Se um falhar, o próximo assume automaticamente (failover).'}
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal ml-4">
              <li>{t('aiProviders.failoverStep1') || 'Provedores da base de dados em ordem de prioridade'}</li>
              <li>{t('aiProviders.failoverStep2') || 'Se todos falharem, o utilizador recebe uma mensagem de erro'}</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              {t('aiProviders.failoverNote') || 'Configure API keys e prioridades para garantir disponibilidade continua. Um provedor com baixa prioridade só será usado se os anteriores falharem.'}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
