'use client';

import React, { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useAppStore, type Language, type AppView } from '@/lib/store';
import { AuthProvider, useAuth } from './auth-context';
import { NotificationProvider, useNotifications } from './notification-context';

// ──────────────────────────────────────────────
// Language Context Interface
// ──────────────────────────────────────────────

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// ──────────────────────────────────────────────
// Simple Translation Map (Mozambique-focused)
// ──────────────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navigation
    'nav.dashboard': 'Painel',
    'nav.vehicles': 'Veículos',
    'nav.partners': 'Parceiros',
    'nav.reports': 'Relatórios',
    'nav.settings': 'Configurações',
    'nav.map': 'Mapa',
    'nav.analytics': 'Análises',
    // Auth
    'auth.login': 'Entrar',
    'auth.logout': 'Sair',
    'auth.register': 'Registar',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.name': 'Nome',
    'auth.welcome': 'Bem-vindo',
    // Common
    'common.search': 'Pesquisar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Adicionar',
    'common.loading': 'Carregando...',
    'common.noData': 'Sem dados',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    // Notifications
    'notif.title': 'Notificações',
    'notif.markAllRead': 'Marcar todas como lidas',
    'notif.clearAll': 'Limpar todas',
    'notif.noNotifications': 'Sem notificações',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Tecnologia inteligente para mobilidade',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.vehicles': 'Vehicles',
    'nav.partners': 'Partners',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.map': 'Map',
    'nav.analytics': 'Analytics',
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.welcome': 'Welcome',
    // Common
    'common.search': 'Search',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.error': 'Error',
    'common.success': 'Success',
    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Mark all as read',
    'notif.clearAll': 'Clear all',
    'notif.noNotifications': 'No notifications',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Smart technology for mobility',
  },
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.vehicles': 'Véhicules',
    'nav.partners': 'Partenaires',
    'nav.reports': 'Rapports',
    'nav.settings': 'Paramètres',
    'nav.map': 'Carte',
    'nav.analytics': 'Analyses',
    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.loginButton': 'Se connecter',
    'auth.register': 'Créer un compte',
    'auth.forgotPassword': 'Mot de passe oublié',
    'auth.resetPassword': 'Réinitialiser',
    'auth.verifyEmail': 'Vérifier l\'e-mail',
    'auth.noAccount': 'Pas de compte',
    'auth.hasAccount': 'Déjà un compte',
    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.overview': 'Vue d\'ensemble',
    'dashboard.activity': 'Activité récente',
    'dashboard.stats': 'Statistiques',
    // Vehicles
    'vehicles.title': 'Véhicules',
    'vehicles.add': 'Ajouter',
    'vehicles.search': 'Rechercher',
    'vehicles.filter': 'Filtrer',
    'vehicles.details': 'Détails',
    // Partners
    'partners.title': 'Partenaires',
    'partners.add': 'Ajouter',
    'partners.affiliate': 'Programme d\'affiliation',
    'partners.commission': 'Commission',
    'partners.link': 'Lien d\'affiliation',
    // Reports
    'reports.title': 'Rapports',
    'reports.generate': 'Générer',
    'reports.download': 'Télécharger',
    'reports.dateRange': 'Période',
    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.notifications': 'Notifications',
    'settings.profile': 'Profil',
    // Map
    'map.title': 'Carte',
    'map.location': 'Localisation',
    'map.directions': 'Itinéraire',
    // Analytics
    'analytics.title': 'Analyses',
    'analytics.daily': 'Quotidien',
    'analytics.weekly': 'Hebdomadaire',
    'analytics.monthly': 'Mensuel',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Technologie intelligente pour la mobilité',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.vehicles': 'Vehículos',
    'nav.partners': 'Socios',
    'nav.reports': 'Informes',
    'nav.settings': 'Ajustes',
    'nav.map': 'Mapa',
    'nav.analytics': 'Análisis',
    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.logout': 'Cerrar sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.loginButton': 'Entrar',
    'auth.register': 'Crear cuenta',
    'auth.forgotPassword': 'Olvidé mi contraseña',
    'auth.resetPassword': 'Restablecer',
    'auth.verifyEmail': 'Verificar correo',
    'auth.noAccount': 'Sin cuenta',
    'auth.hasAccount': 'Ya tengo cuenta',
    // Dashboard
    'dashboard.welcome': 'Bienvenido',
    'dashboard.overview': 'Resumen',
    'dashboard.activity': 'Actividad reciente',
    'dashboard.stats': 'Estadísticas',
    // Vehicles
    'vehicles.title': 'Vehículos',
    'vehicles.add': 'Añadir',
    'vehicles.search': 'Buscar',
    'vehicles.filter': 'Filtrar',
    'vehicles.details': 'Detalles',
    // Partners
    'partners.title': 'Socios',
    'partners.add': 'Añadir',
    'partners.affiliate': 'Programa de afiliados',
    'partners.commission': 'Comisión',
    'partners.link': 'Enlace de afiliado',
    // Reports
    'reports.title': 'Informes',
    'reports.generate': 'Generar',
    'reports.download': 'Descargar',
    'reports.dateRange': 'Periodo',
    // Settings
    'settings.title': 'Ajustes',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.notifications': 'Notificaciones',
    'settings.profile': 'Perfil',
    // Map
    'map.title': 'Mapa',
    'map.location': 'Ubicación',
    'map.directions': 'Direcciones',
    // Analytics
    'analytics.title': 'Análisis',
    'analytics.daily': 'Diario',
    'analytics.weekly': 'Semanal',
    'analytics.monthly': 'Mensual',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Tecnología inteligente para la movilidad',
  },
  zh: {
    // Navigation
    'nav.dashboard': '仪表板',
    'nav.vehicles': '车辆',
    'nav.partners': '合作伙伴',
    'nav.reports': '报告',
    'nav.settings': '设置',
    'nav.map': '地图',
    'nav.analytics': '分析',
    // Auth
    'auth.login': '登录',
    'auth.logout': '退出',
    'auth.email': '电子邮件',
    'auth.password': '密码',
    'auth.loginButton': '登录',
    'auth.register': '注册',
    'auth.forgotPassword': '忘记密码',
    'auth.resetPassword': '重置',
    'auth.verifyEmail': '验证邮箱',
    'auth.noAccount': '没有账户',
    'auth.hasAccount': '已有账户',
    // Dashboard
    'dashboard.welcome': '欢迎',
    'dashboard.overview': '概览',
    'dashboard.activity': '最近活动',
    'dashboard.stats': '统计',
    // Vehicles
    'vehicles.title': '车辆',
    'vehicles.add': '添加',
    'vehicles.search': '搜索',
    'vehicles.filter': '筛选',
    'vehicles.details': '详情',
    // Partners
    'partners.title': '合作伙伴',
    'partners.add': '添加',
    'partners.affiliate': '联盟计划',
    'partners.commission': '佣金',
    'partners.link': '推广链接',
    // Reports
    'reports.title': '报告',
    'reports.generate': '生成',
    'reports.download': '下载',
    'reports.dateRange': '日期范围',
    // Settings
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.notifications': '通知',
    'settings.profile': '个人资料',
    // Map
    'map.title': '地图',
    'map.location': '位置',
    'map.directions': '路线',
    // Analytics
    'analytics.title': '分析',
    'analytics.daily': '每日',
    'analytics.weekly': '每周',
    'analytics.monthly': '每月',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': '智能出行科技',
  },
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.vehicles': 'Fahrzeuge',
    'nav.partners': 'Partner',
    'nav.reports': 'Berichte',
    'nav.settings': 'Einstellungen',
    'nav.map': 'Karte',
    'nav.analytics': 'Analysen',
    // Auth
    'auth.login': 'Anmelden',
    'auth.logout': 'Abmelden',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.loginButton': 'Anmelden',
    'auth.register': 'Registrieren',
    'auth.forgotPassword': 'Passwort vergessen',
    'auth.resetPassword': 'Zurücksetzen',
    'auth.verifyEmail': 'E-Mail bestätigen',
    'auth.noAccount': 'Kein Konto',
    'auth.hasAccount': 'Bereits registriert',
    // Dashboard
    'dashboard.welcome': 'Willkommen',
    'dashboard.overview': 'Übersicht',
    'dashboard.activity': 'Letzte Aktivität',
    'dashboard.stats': 'Statistiken',
    // Vehicles
    'vehicles.title': 'Fahrzeuge',
    'vehicles.add': 'Hinzufügen',
    'vehicles.search': 'Suchen',
    'vehicles.filter': 'Filtern',
    'vehicles.details': 'Details',
    // Partners
    'partners.title': 'Partner',
    'partners.add': 'Hinzufügen',
    'partners.affiliate': 'Partnerprogramm',
    'partners.commission': 'Provision',
    'partners.link': 'Partnerlink',
    // Reports
    'reports.title': 'Berichte',
    'reports.generate': 'Erstellen',
    'reports.download': 'Herunterladen',
    'reports.dateRange': 'Zeitraum',
    // Settings
    'settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'settings.theme': 'Design',
    'settings.notifications': 'Benachrichtigungen',
    'settings.profile': 'Profil',
    // Map
    'map.title': 'Karte',
    'map.location': 'Standort',
    'map.directions': 'Routen',
    // Analytics
    'analytics.title': 'Analysen',
    'analytics.daily': 'Täglich',
    'analytics.weekly': 'Wöchentlich',
    'analytics.monthly': 'Monatlich',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Intelligente Technologie für Mobilität',
  },
};

// ──────────────────────────────────────────────
// Language Context
// ──────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function LanguageProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useAppStore();

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] ?? translations['pt']?.[key] ?? key;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within an AppProvider');
  }
  return context;
}

// ──────────────────────────────────────────────
// Combined App Context Interface
// ──────────────────────────────────────────────

interface AppContextValue {
  // Auth
  auth: ReturnType<typeof useAuth>;
  // Notifications
  notifications: ReturnType<typeof useNotifications>;
  // Language
  language: LanguageContextValue;
  // App state
  currentView: AppView;
  sidebarOpen: boolean;
  searchQuery: string;
  setCurrentView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
}

// ──────────────────────────────────────────────
// Combined App Context
// ──────────────────────────────────────────────

const AppContext = createContext<AppContextValue | undefined>(undefined);

function AppContextInner({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const notifications = useNotifications();
  const languageCtx = useLanguage();
  const appStore = useAppStore();

  const value = useMemo<AppContextValue>(
    () => ({
      auth,
      notifications,
      language: languageCtx,
      currentView: appStore.currentView,
      sidebarOpen: appStore.sidebarOpen,
      searchQuery: appStore.searchQuery,
      setCurrentView: appStore.setCurrentView,
      setSidebarOpen: appStore.setSidebarOpen,
      toggleSidebar: appStore.toggleSidebar,
      setSearchQuery: appStore.setSearchQuery,
    }),
    [auth, notifications, languageCtx, appStore]
  );

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Combined Provider (exported)
// ──────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LanguageProvider>
          <AppContextInner>{children}</AppContextInner>
        </LanguageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

// ──────────────────────────────────────────────
// Combined Hook
// ──────────────────────────────────────────────

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
