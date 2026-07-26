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
    'auth.register': "S'inscrire",
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom',
    'auth.welcome': 'Bienvenue',
    // Common
    'common.search': 'Rechercher',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.loading': 'Chargement...',
    'common.noData': 'Pas de données',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Tout marquer comme lu',
    'notif.clearAll': 'Tout effacer',
    'notif.noNotifications': 'Aucune notification',
    // App
    'app.name': 'Carsai Mozambique',
    'app.tagline': 'Technologie intelligente pour la mobilité',
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
