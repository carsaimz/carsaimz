# Carsai Mozambique — Guia Completo de Setup e Deploy

Este documento cobre todo o processo de configuração, desde o desenvolvimento local até o deploy em produção na Vercel, Firebase, e outras plataformas.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Configuração Local (Desenvolvimento)](#2-configuração-local-desenvolvimento)
3. [Firebase Setup](#3-firebase-setup)
4. [Vercel Deploy (Web)](#4-vercel-deploy-web)
5. [Android Build (Capacitor)](#5-android-build-capacitor)
6. [Windows Desktop (Electron)](#6-windows-desktop-electron)
7. [Chatbot IA (z-ai-web-dev-sdk)](#7-chatbot-ia-z-ai-web-dev-sdk)
8. [Variáveis de Ambiente — Referência Completa](#8-variáveis-de-ambiente--referência-completa)
9. [Docker / Self-Hosted](#9-docker--self-hosted)
10. [Resolução de Problemas](#10-resolução-de-problemas)

---

## 1. Pré-requisitos

| Ferramenta | Versão | Instalação |
|---|---|---|
| **Node.js** | 20+ | `nvm install 20` ou [nodejs.org](https://nodejs.org) |
| **Bun** | 1.3+ | `curl -fsSL https://bun.sh/install \| bash` |
| **Git** | 2.40+ | `apt install git` ou [git-scm.com](https://git-scm.com) |
| **Firebase CLI** | 13+ | `npm install -g firebase-tools` |
| **Android Studio** | Latest | [developer.android.com](https://developer.android.com/studio) (para Android) |

### Clonar o repositório

```bash
git clone https://github.com/carsaimz/carsaimz.git
cd carsaimz
bun install
```

---

## 2. Configuração Local (Desenvolvimento)

### 2.1 Variáveis de ambiente

O projeto usa **hardcoded fallbacks** para a configuração Firebase (client-side), o que significa que o `bun run dev` funciona sem qualquer ficheiro `.env`. No entanto, para o Firebase Admin SDK (server-side) e o chatbot IA, precisa de configurar variáveis.

Copie o ficheiro de exemplo:

```bash
cp .env.example .env.local
```

### 2.2 Ficheiro .z-ai-config (Chatbot IA)

O chatbot usa o `z-ai-web-dev-sdk` que precisa de um ficheiro de configuração. Crie `.z-ai-config` na raiz do projeto:

```json
{
  "baseUrl": "https://internal-api.z.ai/v1",
  "apiKey": "Z.ai",
  "chatId": "seu-chat-id",
  "userId": "seu-user-id",
  "token": "seu-token-jwt"
}
```

> **Nota**: Este ficheiro está no `.gitignore` e **nunca** deve ser commitado. Para Vercel, use as variáveis de ambiente `ZAI_BASE_URL` e `ZAI_API_KEY`.

### 2.3 Iniciar o servidor de desenvolvimento

```bash
bun run dev
```

O servidor estará disponível em `http://localhost:3000`.

### 2.4 Inicializar o banco de dados

Após configurar o Firebase, visite `http://localhost:3000/setup` para criar o super admin e popular o banco de dados. Ou use os scripts:

```bash
bun run firebase:init    # Testar conexão
bun run firebase:seed    # Popular roles, permissões, utilizadores, configurações
```

---

## 3. Firebase Setup

### 3.1 Criar projeto Firebase

1. Aceda [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Nome: `carsai-mozambique`
4. Ative o Google Analytics (opcional, mas recomendado)
5. Clique em **Criar projeto**

### 3.2 Registar Web App

1. No Firebase Console, clique no ícone **Web** (`</>`)
2. Registar app: `Carsai Mozambique`
3. Copie o objeto `firebaseConfig` — os valores já estão no `src/lib/client-config.ts` como fallbacks

### 3.3 Ativar Authentication Providers

1. Vá a **Authentication** → **Sign-in method**
2. Ative os providers desejados:

| Provider | Gratuito (Spark)? | Configuração |
|---|---|---|
| **Email/Password** | Sim | Apenas ativar |
| **Google** | Sim | Selecionar email de suporte + SHA-1 fingerprint |
| **GitHub** | Sim | Criar GitHub OAuth App |
| **Phone (SMS OTP)** | Sim | Ativar + definir números de teste |
| **Anonymous** | Sim | Apenas ativar |

### 3.4 Configurar Google Sign-In (Android)

1. Adicione o **SHA-1 fingerprint** do certificado de assinatura:
   - Debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - Release: `keytool -list -v -keystore upload/release.jks -alias carsai`
2. **Sem o SHA-1, o Google Sign-In NÃO funciona no Android**

### 3.5 Configurar GitHub Sign-In

1. Crie um GitHub OAuth App em https://github.com/settings/developers
2. **Callback URL**: `https://carsai-mozambique-d5983.firebaseapp.com/__/auth/handler`
3. Copie Client ID e Client Secret para o Firebase Console

### 3.6 Service Account (Admin SDK)

1. Vá a **Project Settings** → **Service Accounts**
2. Clique **"Generate new private key"**
3. Guarde o JSON com segurança — **nunca faça commit**

O projeto usa **chave privada encriptada** (AES-256-GCM). Para encriptar:

```bash
node scripts/encrypt-key.js
```

Isto gera `FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED` e `FIREBASE_ADMIN_KEY_SECRET` que são seguros para commitar.

### 3.7 Cloud Messaging (FCM)

1. Vá a **Project Settings** → **Cloud Messaging**
2. Em **Web Push certificates**, gere uma nova VAPID key
3. A chave está no `src/lib/client-config.ts` como `FIREBASE_VAPID_KEY`

### 3.8 Cloud Storage

1. Vá a **Storage** no Firebase Console
2. Clique **"Começar"**
3. Escolha **Modo de teste** (para desenvolvimento)
4. Selecione a localização (ex: `eur3` para Europa)

### 3.9 Firestore Database

1. Vá a **Firestore Database** no Firebase Console
2. Clique **"Criar base de dados"**
3. Escolha **Modo de teste** (para desenvolvimento)
4. **IMPORTANTE**: O modo de teste expira em 30 dias. Deploy das regras antes:

```bash
firebase login
firebase init
firebase deploy --only firestore:rules
```

### 3.10 google-services.json (Android)

1. Vá a **Project Settings** → Your Android app (`com.carsaimz`)
2. Adicione o **SHA-1 fingerprint**
3. Descarregue `google-services.json`
4. Substitua `android/app/google-services.json`
5. **NÃO faça commit** — use GitHub Secret `GOOGLE_SERVICES_JSON`

---

## 4. Vercel Deploy (Web)

### 4.1 Configuração Inicial

1. Aceda [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique **"Add New Project"** → Importe o repositório `carsaimz/carsaimz`
3. Framework Preset: **Next.js** (auto-detectado)
4. Root Directory: `.` (raiz)

### 4.2 Build Settings

| Setting | Valor |
|---|---|
| **Framework Preset** | Next.js |
| **Build Command** | `bun run build` |
| **Output Directory** | `.next` |
| **Install Command** | `bun install` |
| **Node.js Version** | 20.x |

### 4.3 Variáveis de Ambiente na Vercel

Vá a **Settings** → **Environment Variables** e adicione:

#### Firebase Client (públicas — NEXT_PUBLIC_*)

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=carsai-mozambique-d5983.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=carsai-mozambique-d5983
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=carsai-mozambique-d5983.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=136334398331
NEXT_PUBLIC_FIREBASE_APP_ID=1:136334398331:web:...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4P1J5KZHXF
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BOWPwKVMZEKR...
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=117955101988984767727.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://carsaimz.vercel.app
```

#### Firebase Admin (secretas — server-side only)

```
FIREBASE_ADMIN_KEY_SECRET=7ce02cfc25f5182faebc7c83e23ae70384dbf09dd026993c511d6cee344a86ef
FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED=i0eRgLYBqEvYPkvPNAOkgtQ0n...
```

#### Chatbot IA (z-ai-web-dev-sdk)

```
ZAI_BASE_URL=https://internal-api.z.ai/v1
ZAI_API_KEY=Z.ai
```

> **Nota**: Na Vercel, o ficheiro `.z-ai-config` não existe. O API route `/api/chat` usa as variáveis `ZAI_BASE_URL` e `ZAI_API_KEY` como fallback.

### 4.4 Domínio Personalizado

1. Vá a **Settings** → **Domains**
2. Adicione `carsai.mz`
3. Configure o DNS no seu provedor:
   - **Tipo**: CNAME
   - **Nome**: @ (ou www)
   - **Valor**: `cname.vercel-dns.com`
4. Aguarde a propagação DNS (pode demorar até 48 horas)

### 4.5 Deploy Automático

A Vercel faz deploy automático a cada push para `main`. Para deploy manual:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy para produção
vercel --prod
```

---

## 5. Android Build (Capacitor)

### 5.1 Pré-requisitos

- Android Studio instalado
- Java JDK 17+
- Android SDK (API 34+)

### 5.2 Build e Sync

```bash
# Build para Capacitor (gera static export)
BUILD_TARGET=capacitor bun run build

# Sync com Android
bun run cap:sync

# Abrir no Android Studio
bun run cap:open
```

### 5.3 Gerar APK/AAB

1. No Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Use o keystore configurado em `android/keystore.properties`
3. Para AAB (Play Store): escolha **Android App Bundle**
4. Para APK (distribuição direta): escolha **APK**

### 5.4 Keystore

```bash
# Gerar keystore
keytool -genkeypair -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD

# Para GitHub Actions (base64)
base64 -w 0 release.jks > keystore_b64.txt
```

---

## 6. Windows Desktop (Electron)

### 6.1 Desenvolvimento

```bash
bun run electron:dev
```

### 6.2 Build Portable EXE

```bash
bun run electron:build
```

O executável portátil será gerado em `release/`.

---

## 7. Chatbot IA (z-ai-web-dev-sdk)

### 7.1 Como funciona

O chatbot usa o `z-ai-web-dev-sdk` para comunicar com a API de IA. O fluxo é:

1. **Frontend** (`ai-chat-assistant.tsx`) envia mensagem para `/api/chat`
2. **Backend** (`api/chat/route.ts`) usa `z-ai-web-dev-sdk` para gerar resposta
3. O SDK suporta contexto de conversa (últimas 10 mensagens)

### 7.2 Configuração

**Local (desenvolvimento)**: Crie `.z-ai-config` na raiz do projeto.

**Vercel (produção)**: Configure as variáveis `ZAI_BASE_URL` e `ZAI_API_KEY`.

### 7.3 Personalização do System Prompt

O prompt do chatbot está em `src/app/api/chat/route.ts` na constante `CARSAI_CONTEXT`. Edite para alterar o comportamento do assistente.

### 7.4 Funcionalidades do Chatbot

- **4 estados de janela**: fechado, normal, minimizado, ecrã completo
- **Arrastável** no desktop
- **Sessão persistente**: mensagens guardadas em localStorage
- **Memória de conversa**: envia as últimas 10 mensagens como contexto
- **Perguntas rápidas**: 4 perguntas pré-definidas
- **Indicador de não lidas**: badge no FAB quando há novas mensagens
- **Saudação automática**: mensagem de boas-vindas ao abrir
- **Atalhos de teclado**: ESC para fechar/minimizar
- **Responsivo**: ecrã completo no mobile, arrastável no desktop

---

## 8. Variáveis de Ambiente — Referência Completa

### Firebase Client (NEXT_PUBLIC_* — públicas)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sim | API key do Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sim | Domínio de autenticação |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sim | Bucket do Cloud Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sim | Sender ID do FCM |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sim | ID da app Firebase |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Não | ID do Google Analytics |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Não | Chave VAPID para web push |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Não | Client ID do Google OAuth (Android) |
| `NEXT_PUBLIC_API_URL` | Não | URL da API (para Capacitor mobile) |
| `NEXT_PUBLIC_APP_VERSION` | Não | Versão da app |
| `NEXT_PUBLIC_APP_BUILD` | Não | Número de build |

### Firebase Admin (server-side only — secretas)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `FIREBASE_ADMIN_KEY_SECRET` | Sim* | Segredo para desencriptar a chave privada |
| `FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED` | Sim* | Chave privada encriptada (AES-256-GCM) |
| `FIREBASE_ADMIN_PROJECT_ID` | Não | ID do projeto (tem fallback hardcoded) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Não | Email da service account (tem fallback) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Não* | Chave privada em texto (alternativa à encriptada) |

> *Use a chave encriptada (preferido) ou a chave em texto plano, nunca ambas.

### Chatbot IA (z-ai-web-dev-sdk)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ZAI_BASE_URL` | Sim* | URL base da API de IA (ex: `https://internal-api.z.ai/v1`) |
| `ZAI_API_KEY` | Sim* | API key para autenticação |
| `ZAI_CHAT_ID` | Não | ID do chat |
| `ZAI_USER_ID` | Não | ID do utilizador |
| `ZAI_TOKEN` | Não | Token JWT |

> *Obrigatório apenas na Vercel. Em desenvolvimento local, o SDK auto-detecta o ficheiro `.z-ai-config`.

### Android Keystore (CI/CD)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `KEYSTORE_FILE` | Sim | Keystore em base64 |
| `KEYSTORE_PASSWORD` | Sim | Password do keystore |
| `KEYSTORE_ALIAS` | Sim | Alias da chave |
| `KEY_PASSWORD` | Sim | Password da chave |
| `GOOGLE_SERVICES_JSON` | Sim | `google-services.json` em base64 |

---

## 9. Docker / Self-Hosted

### 9.1 Usando o build standalone

O projeto suporta build standalone para Docker:

```bash
# Build standalone
BUILD_TARGET=standalone bun run build
```

### 9.2 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN BUILD_TARGET=standalone npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### 9.3 Docker Compose

```yaml
version: '3.8'
services:
  carsai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - FIREBASE_ADMIN_KEY_SECRET=${FIREBASE_ADMIN_KEY_SECRET}
      - FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED=${FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED}
      - ZAI_BASE_URL=${ZAI_BASE_URL}
      - ZAI_API_KEY=${ZAI_API_KEY}
    restart: unless-stopped
```

### 9.4 Deploy com Docker

```bash
# Build e execução
docker compose up -d --build

# Logs
docker compose logs -f carsai
```

---

## 10. Resolução de Problemas

### "Unexpected token '<'" em Blog/Fórum

- **Causa**: A API route retorna HTML (404) em vez de JSON
- **Solução**: O `apiFetch` já faz fallback automático. Verifique se o Firestore está configurado e populado

### Conta criada mas perfil não guardado

- **Causa**: Regras de segurança do Firestore bloqueiam escritas
- **Solução**: Faça deploy das regras: `firebase deploy --only firestore:rules`

### Google Sign-In não funciona no Android

- **Causa 1**: `google-services.json` tem valores placeholder
- **Solução 1**: Descarregue o ficheiro correto do Firebase Console
- **Causa 2**: SHA-1 fingerprint não adicionado
- **Solução 2**: Adicione o SHA-1 em Project Settings → Your Android app

### Chatbot não funciona

- **Causa 1**: `.z-ai-config` não existe (local)
- **Solução 1**: Crie o ficheiro na raiz do projeto
- **Causa 2**: Variáveis `ZAI_BASE_URL` e `ZAI_API_KEY` não configuradas (Vercel)
- **Solução 2**: Adicione as variáveis nas Environment Variables da Vercel

### Regras do Firestore expiram em 30 dias

- **Causa**: Modo de teste expira automaticamente
- **Solução**: `firebase deploy --only firestore:rules` antes de expirar

### Base de dados vazia

- **Causa**: Firestore criado mas não populado
- **Solução**: Visite `/setup` ou execute `bun run firebase:seed`

### Build falha na Vercel

- **Causa**: Variáveis de ambiente ausentes
- **Solução**: Verifique se `FIREBASE_ADMIN_KEY_SECRET` e `FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED` estão configuradas

### Erro de "jose" ESM module

- **Causa**: Conflito de módulos ESM/CJS
- **Solução**: O `next.config.ts` já tem alias para forçar a versão CJS. Se o erro persistir, limpe a cache: `rm -rf .next && bun run build`
