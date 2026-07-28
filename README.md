# Carsai Mozambique

Plataforma de serviços empresariais para Moçambique — web, Android (Capacitor) e Windows (Electron).

## Visão Geral

Carsai Mozambique é uma plataforma multiplataforma construída com Next.js 16, Firebase (Spark Plan gratuito) e Capacitor. Oferece autenticação, gestão de conteúdos, blog, fórum, orçamentos, faturas, suporte ao cliente e push notifications.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | Firebase Firestore (NoSQL — Spark Plan gratuito) |
| **Auth** | Firebase Auth (Email/Password, Google, Phone SMS, Anonymous) |
| **Storage** | Firebase Cloud Storage (5GB gratuito) |
| **Push** | Firebase Cloud Messaging (FCM — gratuito) |
| **Analytics** | Firebase Analytics (gratuito) |
| **Mobile** | Capacitor 8 (Android) |
| **Desktop** | Electron (Windows Portable EXE) |
| **CI/CD** | GitHub Actions (4 workflows) |
| **Package Manager** | Bun |

## Funcionalidades

### Autenticação (4 métodos gratuitos)
- **Email/Password** — Login e registo com email
- **Google Sign-In** — Login com conta Google
- **Phone/SMS OTP** — Login com número de telefone (SMS)
- **Anonymous** — Acesso como convidado

### Firebase Services (Spark Plan — gratuito)
- **Firestore** — 1GB storage, 50K reads/dia, 20K writes/dia
- **Cloud Storage** — 5GB gratuito
- **Cloud Messaging** — Push notifications ilimitadas
- **Analytics** — Tracking gratuito
- **App Check** — Proteção contra abuso
- **Crashlytics** — Relatório de crashes
- **Performance Monitoring** — Monitorização gratuita
- **Remote Config** — Configuração dinâmica

### Plataforma
- **Blog** — Posts, categorias, tags, comentários
- **Fórum** — Tópicos, respostas, likes
- **Serviços** — Catálogo de serviços empresariais
- **Projetos** — Portfólio de projetos
- **Testemunhos** — Depoimentos de clientes
- **Orçamentos** — Sistema de cotações
- **Propostas** — Propostas comerciais
- **Faturas** — Gestão de faturas e pagamentos
- **Suporte** — Tickets de suporte
- **Newsletter** — Subscrição de emails
- **Notificações** — Push notifications (FCM)
- **Admin Dashboard** — Painel de administração completo

## Quick Start

### Pré-requisitos

- [Bun](https://bun.sh/) v1.3+
- [Node.js](https://nodejs.org/) v20+
- [Firebase Console](https://console.firebase.google.com/) — projeto criado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/carsaimz/carsaimz.git
cd carsaimz

# Instalar dependências
bun install

# Configurar Firebase Admin SDK (para API routes e seed)
# Copiar .env.example para .env.local e preencher
cp .env.example .env.local
# Editar .env.local com as credenciais Firebase Admin

# Iniciar desenvolvimento
bun run dev
```

### Configuração Firebase

Veja o guia completo: [docs/firebase-setup.md](docs/firebase-setup.md)

### Seed da Base de Dados

```bash
# Testar conexão Firebase
bun run firebase:init

# Popular base de dados (roles, permissions, users, settings)
bun run firebase:seed
```

## Estrutura do Projeto

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Páginas públicas
│   │   ├── (dashboard)/        # Painel de administração
│   │   └── api/                # API Routes (server-side)
│   │       └── auth/           # Auth endpoints (login, register, social, anonymous)
│   ├── components/             # Componentes React
│   │   ├── common/             # Componentes partilhados (login-modal, etc.)
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/               # React Contexts (auth)
│   ├── lib/                    # Bibliotecas e configurações
│   │   ├── client-config.ts    # Config do cliente (Firebase config + feature flags)
│   │   ├── firebase-client.ts  # Firebase Client SDK (browser-side)
│   │   ├── firebase-admin.ts   # Firebase Admin SDK (server-side)
│   │   ├── db.ts               # Firestore CRUD service
│   │   ├── fcm.ts              # FCM messaging (server-side)
│   │   ├── serialize.ts        # Firestore Timestamp converter
│   │   └── api-base.ts         # API URL builder (Capacitor/web/Electron)
│   └── hooks/                  # Custom React hooks
├── android/                    # Capacitor Android project
│   └── app/
│       ├── google-services.json  # Firebase Android config
│       └── src/main/AndroidManifest.xml
├── scripts/                    # Build e seed scripts
│   ├── build.js                # Cross-platform build script
│   ├── firebase-init.js        # Testar conexão Firebase
│   ├── firebase-seed.js        # Seed da base de dados
│   └── post-build.js           # Copiar assets para standalone
├── .github/workflows/          # CI/CD
│   ├── ci.yml                  # Lint + Build check
│   ├── android-build.yml       # APK + AAB build
│   ├── windows-build.yml       # Windows Portable EXE
│   └── release.yml             # Release multi-plataforma
├── docs/                       # Documentação
│   └── firebase-setup.md       # Guia de configuração Firebase
├── .env.example                # Template de variáveis de ambiente
└── next.config.ts              # Next.js config (output: "export" para Capacitor)
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Servidor de desenvolvimento (porta 3000) |
| `bun run build` | Build Next.js (static export para Capacitor) |
| `bun run lint` | ESLint |
| `bun run firebase:init` | Testar conexão Firebase |
| `bun run firebase:seed` | Popular base de dados Firestore |
| `bun run cap:sync` | Sincronizar Capacitor |
| `bun run cap:open:android` | Abrir Android Studio |

## Configuração de Ambiente

### Estratégia: Env Vars com Fallbacks Hardcoded

O projeto usa uma estratégia segura de configuração:

- **`src/lib/client-config.ts`** — Usa `process.env.NEXT_PUBLIC_FIREBASE_* || hardcoded_fallback`
- **CI/Workflows** — Injetam env vars de GitHub Secrets (override dos fallbacks)
- **Local dev** — Fallbacks hardcoded funcionam sem `.env`

Isto significa:
- Não precisa de `.env` para desenvolvimento local (Firebase client config tem fallbacks)
- Os GitHub Secrets nos workflows podem override os fallbacks se necessário
- Apenas `FIREBASE_ADMIN_*` precisa de `.env.local` (server-side, verdadeiramente secreto)

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `FIREBASE_ADMIN_PROJECT_ID` | Sim (server) | Firebase project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Sim (server) | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Sim (server) | Service account private key |
| `NEXT_PUBLIC_API_URL` | Não | URL do servidor para app mobile |
| `NEXT_PUBLIC_FIREBASE_*` | Não | Override dos fallbacks hardcoded |

## CI/CD

### Workflows

| Workflow | Trigger | Output |
|----------|---------|--------|
| **CI** | Push/PR | Lint + Build check |
| **Android Build** | Push main / Tag v* | APK + AAB |
| **Windows Build** | Push main / Tag v* | Portable EXE |
| **Release** | Tag v* | Web + Android + Windows + GitHub Release |

### GitHub Secrets Necessários

Ver lista completa: [docs/firebase-setup.md#9-all-github-secrets-reference](docs/firebase-setup.md#9-all-github-secrets-reference)

### Android Keystore

Para assinar APKs/AABs, configure:

```bash
# Codificar keystore em base64
base64 -w 0 release.jks > keystore_b64.txt

# Definir secrets
gh secret set KEYSTORE_FILE -b "$(cat keystore_b64.txt)"
gh secret set KEYSTORE_PASSWORD -b "your-password"
gh secret set KEYSTORE_ALIAS -b "release"
gh secret set KEY_PASSWORD -b "your-password"
```

## Contato

- **Email**: carsaimozambique@gmail.com
- **Suporte**: suporte.carsaimz@gmail.com
- **M-Pesa**: 847545020
- **Localização**: Montepuez, Cabo Delgado, Moçambique

## Licença

Copyright © 2025 Carsai Mozambique. Todos os direitos reservados.
