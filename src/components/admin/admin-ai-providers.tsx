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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-fetch';

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

export function AdminAiProviders() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      const data = await res.json();
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
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Provedor adicionado', description: `${addForm.name} adicionado com sucesso` });
        setAddForm({ name: '', displayName: '', apiKey: '', baseUrl: '', model: '', priority: 10 });
        setShowAddForm(false);
        fetchProviders();
      } else {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao adicionar provedor', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/ai-providers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Provedor removido' });
        fetchProviders();
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: isActive ? 'Provedor activado' : 'Provedor desactivado' });
        fetchProviders();
      }
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const handlePriority = async (id: string, newPriority: number) => {
    try {
      const res = await apiFetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) fetchProviders();
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' });
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
          Provedores de IA
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure provedores de IA para o chatbot. Se um falhar, o próximo na lista assume automaticamente (failover).
          O Z.ai é sempre o primeiro provedor (built-in, sem configuração necessária).
        </p>
      </motion.div>

      {/* ── Built-in Z.ai (always first) ── */}
      <motion.div variants={itemVariants}>
        <Card className="border-red-200/60 dark:border-red-800/60">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <Zap className="size-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Z.ai (Built-in)</span>
                <Badge variant="default" className="bg-red-600 text-white text-xs">Primário</Badge>
                <Badge variant="outline" className="text-xs">Prioridade: 0</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Provedor padrão, sempre activo. Sem necessidade de API key.</p>
            </div>
            <Shield className="size-4 text-green-500 shrink-0" />
          </CardContent>
        </Card>
      </motion.div>

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
                    <Badge variant="outline" className="text-xs">Prioridade: {provider.priority}</Badge>
                    <Badge variant={provider.isActive ? 'default' : 'secondary'} className={`text-xs ${provider.isActive ? 'bg-blue-600 text-white' : ''}`}>
                      {provider.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Modelo: {provider.model || 'N/A'} | Base URL: {provider.baseUrl || 'N/A'}
                  </p>
                  {provider.apiKey && (
                    <p className="text-xs text-muted-foreground">API Key: ...{provider.apiKey.slice(-4)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePriority(provider.id, provider.priority - 1)} title="Subir prioridade">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePriority(provider.id, provider.priority + 1)} title="Descer prioridade">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(provider.id, !provider.isActive)} title={provider.isActive ? 'Desactivar' : 'Activar'}>
                    {provider.isActive ? <ToggleRight className="size-4 text-green-500" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(provider.id)} title="Remover">
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
          Adicionar Provedor
        </Button>
      </motion.div>

      {/* ── Add Provider Form ── */}
      {showAddForm && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><CardTitle>Novo Provedor de IA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Preset quick-select */}
              <div className="space-y-2">
                <Label>Provedores predefinidos (clique para preencher)</Label>
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
                  <Label htmlFor="add-name">Nome (identificador)</Label>
                  <Input id="add-name" placeholder="groq, deepseek, gemini..." value={addForm.name} onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-displayName">Nome visível</Label>
                  <Input id="add-displayName" placeholder="Groq (Llama 3.3 70B)" value={addForm.displayName} onChange={(e) => setAddForm(prev => ({ ...prev, displayName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-apiKey">API Key</Label>
                  <Input id="add-apiKey" type="password" placeholder="sk-..." value={addForm.apiKey} onChange={(e) => setAddForm(prev => ({ ...prev, apiKey: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-baseUrl">Base URL</Label>
                  <Input id="add-baseUrl" placeholder="https://api.groq.com/openai/v1" value={addForm.baseUrl} onChange={(e) => setAddForm(prev => ({ ...prev, baseUrl: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-model">Modelo</Label>
                  <Input id="add-model" placeholder="llama-3.3-70b-versatile" value={addForm.model} onChange={(e) => setAddForm(prev => ({ ...prev, model: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-priority">Prioridade (0 = primeiro)</Label>
                  <Input id="add-priority" type="number" value={addForm.priority} onChange={(e) => setAddForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 10 }))} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleAdd}>
                  <Save className="size-4" />
                  Adicionar
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Failover Explanation ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="size-4 text-green-500" />
              Sistema de Failover
            </h3>
            <p className="text-sm text-muted-foreground">
              Quando um utilizador envia uma mensagem, o chatbot tenta os provedores em ordem de prioridade:
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal ml-4">
              <li><strong>Z.ai (built-in)</strong> — sempre primeiro, sem API key</li>
              <li>Provedores externos em ordem de prioridade (número menor = tentado primeiro)</li>
              <li>Se todos falharem, o utilizador recebe uma mensagem de erro honesta (sem respostas genéricas)</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              Configure API keys e prioridades para garantir disponibilidade continua. Um provedor com baixa prioridade só será usado se os anteriores falharem.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
