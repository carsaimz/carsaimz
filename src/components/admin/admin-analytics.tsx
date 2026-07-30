'use client';
import { motion } from 'framer-motion';
import { ScrollText, Activity, Clock, AlertTriangle, Server, Cpu, HardDrive, Zap, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Mock data for analytics
const systemHealthMetrics = [
  { label: 'Uptime', value: '99.97%', status: 'healthy' as const },
  { label: 'Active Connections', value: '1,247', status: 'healthy' as const },
  { label: 'Memory Usage', value: '68%', status: 'warning' as const },
  { label: 'CPU Usage', value: '42%', status: 'healthy' as const },
  { label: 'Disk Usage', value: '73%', status: 'warning' as const },
  { label: 'Cache Hit Rate', value: '94.2%', status: 'healthy' as const },
];

const apiResponseTimes = [
  { endpoint: '/api/posts', avgMs: 45, p99Ms: 120, requests: 12450 },
  { endpoint: '/api/forum', avgMs: 62, p99Ms: 180, requests: 8920 },
  { endpoint: '/api/dashboard', avgMs: 85, p99Ms: 250, requests: 6780 },
  { endpoint: '/api/support', avgMs: 55, p99Ms: 150, requests: 3420 },
  { endpoint: '/api/auth/login', avgMs: 120, p99Ms: 350, requests: 5670 },
  { endpoint: '/api/comments', avgMs: 38, p99Ms: 95, requests: 7890 },
];

const errorRates = [
  { period: 'Last 24h', errors: 12, total: 45200, rate: '0.027%' },
  { period: 'Last 7d', errors: 87, total: 315000, rate: '0.028%' },
  { period: 'Last 30d', errors: 345, total: 1280000, rate: '0.027%' },
  { period: 'Last 90d', errors: 1120, total: 3840000, rate: '0.029%' },
];

const recentErrors = [
  { time: '2 min ago', method: 'POST', path: '/api/forum/topics', status: 500, message: 'Internal server error' },
  { time: '15 min ago', method: 'GET', path: '/api/support', status: 504, message: 'Gateway timeout' },
  { time: '1h ago', method: 'POST', path: '/api/comments', status: 422, message: 'Validation failed' },
  { time: '3h ago', method: 'GET', path: '/api/dashboard', status: 503, message: 'Service unavailable' },
];

function getStatusColor(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
  }
}

function getStatusIcon(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy': return <ShieldCheck className="w-4 h-4" />;
    case 'warning': return <AlertTriangle className="w-4 h-4" />;
    case 'critical': return <AlertTriangle className="w-4 h-4" />;
  }
}

export function AdminAnalytics() {
  const { t } = useLanguage();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold flex items-center gap-2"><ScrollText className="h-6 w-6 text-emerald-600" />{t('admin.systemLogs') || 'Analytics & Logs'}</h2>
        <p className="text-muted-foreground mt-1">System analytics, logs and performance metrics</p>
      </motion.div>

      {/* System Health Metrics */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {systemHealthMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background">
                  <div className={`p-2 rounded-full ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Response Times */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              API Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apiResponseTimes.map((api) => {
                const avgPct = Math.min((api.avgMs / 200) * 100, 100);
                const p99Pct = Math.min((api.p99Ms / 500) * 100, 100);
                return (
                  <div key={api.endpoint} className="p-3 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-foreground">{api.endpoint}</code>
                      <span className="text-xs text-muted-foreground">{api.requests.toLocaleString()} requests</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Avg</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${avgPct < 50 ? 'bg-emerald-500' : avgPct < 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${avgPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{api.avgMs}ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">P99</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p99Pct < 50 ? 'bg-emerald-500' : p99Pct < 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${p99Pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{api.p99Ms}ms</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Rates */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-600" />
              Error Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorRates.map((row) => (
                <div key={row.period} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.period}</p>
                    <p className="text-xs text-muted-foreground">{row.errors} errors / {row.total.toLocaleString()} requests</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{row.rate}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentErrors.map((err, i) => (
                <div key={i} className="p-3 rounded-lg border border-red-200/50 bg-red-50/30">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">{err.status}</Badge>
                      <code className="text-xs font-mono text-foreground">{err.method} {err.path}</code>
                    </div>
                    <span className="text-xs text-muted-foreground">{err.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{err.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resource Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              Resource Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-background">
                <Cpu className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <p className="text-xl font-bold text-foreground">42%</p>
                  <p className="text-xs text-muted-foreground">4 cores active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-background">
                <HardDrive className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Disk</p>
                  <p className="text-xl font-bold text-foreground">73%</p>
                  <p className="text-xs text-muted-foreground">14.6 GB / 20 GB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-background">
                <Zap className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Bandwidth</p>
                  <p className="text-xl font-bold text-foreground">2.4 TB</p>
                  <p className="text-xs text-muted-foreground">of 5 TB limit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
