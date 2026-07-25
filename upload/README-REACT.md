PROJECTO CARSAI MOZAMBIQUE – DOCUMENTAÇÃO TÉCNICA COMPLETA

Versão: 1.0.0
Data: 25 de Julho de 2026
Stack: Fullstack JavaScript (Node.js + React + Vite) com Supabase, Firebase, Capacitor e Electron

---

1. ARQUITETURA GERAL DO SISTEMA

O Carsai Mozambique é uma aplicação fullstack moderna, desenvolvida inteiramente em JavaScript/TypeScript, e desenhada para funcionar como uma plataforma única para web, dispositivos móveis (Android, iOS) e desktop (Windows, macOS, Linux). A arquitetura assenta em três pilares:

· Backend (Node.js + Express): Servidor HTTP e API RESTful, responsável pela lógica de negócio, autenticação, autorização, processamento de pagamentos, geração de documentos, envio de emails e integração com serviços externos.
· Frontend (React + Vite): Interface de utilizador reactiva, com renderização do lado do cliente, gestão de estado via Context API e React Query, e componentes interativos que incluem elementos 3D (Three.js) e fragmentos HTML dinâmicos (HTMX).
· Camada de Empacotamento (Capacitor + Electron): Transforma a aplicação web em aplicações nativas para Android (APK/AAB), iOS (IPA) e desktop (EXE, DMG, AppImage), mantendo uma única base de código.

O fluxo de dados é unidirecional: o frontend consome a API REST do backend, que por sua vez interage com o Supabase (banco de dados, autenticação, storage e realtime). Para funcionalidades específicas (notificações push, analytics, etc.), o sistema integra serviços do Firebase. A comunicação em tempo real (notificações, chat) é feita via WebSockets (Socket.io) ou via Supabase Realtime.

---

2. ESTRUTURA FÍSICA DE DIRETÓRIOS (RAIZ DO PROJECTO)

```
carsai-mozambique/
├── backend/                         # Servidor Node.js
│   ├── src/
│   │   ├── config/                  # Configurações (supabase, firebase, email, mpesa)
│   │   ├── controllers/             # Lógica dos endpoints
│   │   ├── models/                  # Interação com Supabase (tabelas)
│   │   ├── routes/                  # Definição de rotas API e HTMX
│   │   ├── middlewares/             # Auth, rate-limit, validação, CSRF
│   │   ├── services/                # EmailService, PdfService, MpesaService, FirebaseService
│   │   ├── utils/                   # Helpers, i18n, logger, validators
│   │   ├── jobs/                    # Tarefas agendadas (cron)
│   │   ├── types/                   # Definições TypeScript
│   │   ├── app.js                   # Instanciação do Express
│   │   └── server.js                # Ponto de entrada do servidor
│   ├── views/                       # Templates HTML (para HTMX)
│   ├── lang/                        # Ficheiros de tradução (JSON)
│   │   ├── pt-br.json
│   │   ├── en-us.json
│   │   └── ... (detectados dinamicamente)
│   ├── uploads/                     # Ficheiros enviados (imagens, anexos)
│   ├── storage/                     # Logs, backups, ficheiros temporários
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                         # Variáveis de ambiente (não versionado)
│
├── frontend/                        # Aplicação React
│   ├── public/                      # index.html, assets estáticos, sons, flags
│   ├── src/
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── common/              # Button, Loader, Toast, Modal
│   │   │   ├── layout/              # Header, Footer, Sidebar
│   │   │   ├── public/              # Home, About, Services, Projects
│   │   │   ├── blog/                # Blog (com HTMX)
│   │   │   ├── forum/               # Fórum (com HTMX)
│   │   │   ├── user/                # Dashboard do utilizador
│   │   │   ├── admin/               # Painel administrativo
│   │   │   ├── partner/             # Dashboard do parceiro
│   │   │   └── three/               # Componentes 3D (Three.js)
│   │   ├── pages/                   # Páginas do React Router
│   │   ├── hooks/                   # Custom hooks (useAuth, useTheme, useLanguage)
│   │   ├── contexts/                # Context Providers (Auth, Theme, Language)
│   │   ├── services/                # Cliente API (Axios), Firebase, Supabase client
│   │   ├── utils/                   # i18n, formatters, validators, sound
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── routes.jsx
│   ├── capacitor.config.json
│   ├── electron/                    # Configuração Electron
│   ├── package.json
│   ├── vite.config.js
│   └── tsconfig.json
│
├── installer/                       # Código do instalador web (wizard)
│   ├── index.html                   # Página inicial do wizard
│   ├── assets/                      # CSS/JS específicos do instalador
│   └── steps/                       # Componentes de cada passo (conexão Supabase, admin, etc.)
│
├── .github/                         # Workflows CI/CD
│   └── workflows/
│       ├── build-web.yml
│       ├── build-android.yml
│       ├── build-desktop.yml
│       └── release.yml
│
├── docker-compose.yml               # Orquestração para desenvolvimento
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env
└── README.md
```

---

3. BACKEND (NODE.JS + EXPRESS + SUPABASE)

3.1. Stack e Bibliotecas Principais

· Runtime: Node.js 20 LTS ou superior
· Framework: Express.js
· Linguagem: TypeScript
· Banco de Dados e Autenticação: Supabase (PostgreSQL + Auth + Storage + Realtime)
· Email: Nodemailer com suporte a filas (BullMQ)
· PDFs: PDFKit ou Puppeteer
· Excel: ExcelJS
· Upload: Multer
· WebSockets: Socket.io (ou Supabase Realtime para casos simples)
· Logs: Winston
· Validação: Zod
· Agendamento: node-cron

3.2. Integração com Supabase

O Supabase é a fonte primária de dados. A conexão é feita através do cliente oficial @supabase/supabase-js, que fornece:

· Autenticação: Gestão de utilizadores, login com email/senha, OAuth (Google, Facebook), recuperação de password, e verificação de email.
· Banco de Dados: Acesso direto às tabelas PostgreSQL com suporte a RLS (Row Level Security) para controlo de permissões.
· Storage: Armazenamento de ficheiros (imagens de projectos, avatares, anexos de orçamentos) em buckets públicos/privados.
· Realtime: Sincronização de dados em tempo real para notificações e actualizações de estado.

O modelo de dados inclui as seguintes entidades principais (tabelas):
users, roles, permissions, role_permissions, pages, services, projects, testimonials, posts, categories, tags, comments, forum_categories, forum_topics, forum_posts, forum_likes, quotes, proposals, payments, invoices, invoice_items, email_templates, email_queue, notifications, subscribers, affiliate_clicks, affiliate_commissions, support_tickets, ticket_replies, settings, logs, backups.

Todas as queries utilizam o cliente Supabase, garantindo segurança e performance. As políticas RLS são definidas no próprio Supabase para restringir acesso conforme o papel do utilizador.

3.3. Autenticação e Permissões

· JWT: Gerado pelo Supabase Auth; o middleware verifica o token em cada requisição protegida.
· Roles e Permissões: Tabelas roles e permissions com relação muitos-para-muitos. A verificação é feita via consulta à base de dados ou cache em Redis.
· Middlewares: auth, admin, partner, user, permission para controlar acesso a rotas específicas.

3.4. Internacionalização (i18n) no Backend

Os ficheiros de tradução residem em /backend/lang/ no formato pt-br.json, en-us.json, etc. Cada ficheiro contém um objecto com chaves e respectivas traduções.

· Detecção de idioma: O middleware analisa o cabeçalho Accept-Language do navegador, o cookie lang e a preferência do utilizador (se autenticado), nessa ordem de prioridade.
· Bandeiras: As bandeiras são servidas como imagens SVG ou emojis, com mapeamento entre código do idioma e bandeira (ex: pt-br -> 🇧🇷, en-us -> 🇺🇸). A lista de idiomas disponíveis é obtida dinamicamente a partir dos ficheiros presentes na pasta lang/.
· Função de tradução: t(key, params) nos controllers e views, que substitui placeholders como {{name}}.

3.5. Serviços Especiais

· EmailService: Envia emails usando Nodemailer, com templates em HTML e suporte a filas (BullMQ) para evitar bloqueios.
· PdfService: Gera facturas, propostas e relatórios em PDF, utilizando PDFKit para renderização directa ou Puppeteer para HTML-to-PDF.
· MpesaService: Integração com a API M-Pesa para processamento de pagamentos (STK Push e consulta de transacções).
· FirebaseService: Gerencia notificações push (FCM) para dispositivos móveis e analytics.
· SupabaseRealtime: Escuta eventos de inserção/actualização em tabelas para disparar notificações em tempo real.

3.6. Tarefas Agendadas (Cron Jobs)

Utilizando node-cron, são executadas as seguintes tarefas:

· Envio de emails em fila (a cada 5 minutos).
· Backup automático do banco de dados (dump SQL) para o Supabase Storage (diário às 02:00).
· Limpeza de logs com mais de 90 dias (semanal).
· Verificação de pagamentos pendentes e envio de lembretes (diário).
· Actualização do sitemap.xml (diário após novos posts).
· Processamento de comissões de afiliados (após confirmação de pagamento).

---

4. FRONTEND (REACT + VITE)

4.1. Stack e Bibliotecas Principais

· React: 19.x com componentes funcionais e hooks.
· Vite: Bundler rápido para desenvolvimento e build.
· TypeScript: Tipagem estática.
· Gestão de Estado: Context API para temas, idioma e autenticação; React Query (TanStack) para cache de dados da API; Zustand para estados locais mais complexos.
· Roteamento: React Router v6 com rotas aninhadas.
· Estilização: Tailwind CSS com suporte a tema claro/escuro.
· UI Components: SweetAlert2 para modais; React-Toastify para notificações toast; FontAwesome para ícones.
· Editor Rich Text: Quill (via react-quill) para posts, propostas e conteúdo do admin.
· Gráficos: Chart.js com react-chartjs-2.
· 3D: Three.js, @react-three/fiber e @react-three/drei.
· Requisições HTMX: HTMX (via script CDN) com wrapper React para componentes que beneficiam de HTML servido directamente.

4.2. Estrutura de Contextos

· AuthContext: Gerencia o estado do utilizador, token JWT e funções de login/logout/registo.
· ThemeContext: Tema claro/escuro, persistido em localStorage e sincronizado com a preferência do sistema operativo.
· LanguageContext: Idioma actual, lista de idiomas disponíveis (obtida do backend), função t(key, params) e bandeira correspondente. A detecção inicial é feita via cookie ou cabeçalho.
· NotificationContext: Controla a exibição de toasts e modais, com integração de sons.

4.3. Integração com Supabase e Firebase no Frontend

· Supabase: Utilizado para autenticação directa (login social, recuperação de password) e para acesso a dados em tempo real através do cliente @supabase/supabase-js. Para as restantes operações, o frontend comunica com a API do backend, que actua como proxy seguro.
· Firebase: O SDK do Firebase é utilizado para:
  · Notificações Push (FCM): Registar o dispositivo e receber mensagens, geridas pelo service worker.
  · Analytics: Recolha de eventos de utilização (opcional, com consentimento do utilizador).
  · Firebase Cloud Messaging também pode ser usado para notificações em segundo plano em Android.

4.4. Internacionalização (i18n) no Frontend

· Os ficheiros de tradução (JSON) são obtidos do backend durante a inicialização e armazenados em cache. A função t(key, params) é fornecida pelo LanguageContext.
· Detecção dinâmica de idiomas: A lista de idiomas disponíveis é actualizada sempre que um novo ficheiro é adicionado ao servidor (via endpoint /api/languages). O frontend consulta esse endpoint periodicamente ou após o login do administrador.
· Bandeiras: Cada idioma é exibido com a sua bandeira, carregada a partir de um mapa de códigos (ex: pt-br -> 🇧🇷). As bandeiras são armazenadas em frontend/public/flags/ como SVGs ou emojis.
· Seleccção de idioma: Um dropdown no cabeçalho mostra todos os idiomas disponíveis com bandeira; ao seleccionar, o cookie lang é actualizado e a página recarrega para aplicar a nova tradução.

4.5. Componentes Especiais

· Loader universal: Overlay que aparece durante 3 segundos fixos em mudanças de tema, idioma e navegação, utilizando useEffect e setTimeout.
· HTMXWrapper: Componente que envolve partes do DOM e activa atributos hx-*, permitindo carregar HTML directamente do backend sem necessidade de estado React.
· Three.js Visualizações: Componentes como InteractiveGlobe e ProjectShowcase utilizam React Three Fiber para renderizar cenas 3D interativas (rotação, zoom, hover).

4.6. Sons

Os sons estão em frontend/public/sounds/ e são reproduzidos através do hook useSound(). Os eventos incluem:

· notification.mp3 – novas notificações
· success.mp3 – acções bem-sucedidas
· error.mp3 – erros
· click.mp3 – cliques em botões
· cash.mp3 – confirmação de pagamento

Se o ficheiro não existir, a reprodução é ignorada silenciosamente.

---

5. INSTALADOR WEB (WIZARD)

O instalador é uma aplicação separada, servida na raiz do domínio quando o sistema ainda não está configurado. O objectivo é guiar o administrador na configuração inicial do Carsai Mozambique, de forma simples e segura.

5.1. Funcionamento

O instalador é uma página HTML/JS estática (ou servida pelo backend em modo de configuração) que executa os seguintes passos:

1. Verificação de requisitos: PHP não se aplica; verifica versão do Node.js, permissões de escrita em pastas e conectividade com a internet.
2. Conexão ao Supabase: O administrador fornece as credenciais (URL e chave pública/privada). O instalador testa a ligação e armazena as variáveis no ficheiro .env.
3. Configuração do Firebase: (opcional) Insere as chaves do projecto Firebase para notificações push e analytics.
4. Criação do administrador: Define o primeiro utilizador com papel de administrador (nome, email, senha) através da API de autenticação do Supabase.
5. Configuração do site: Define título, idioma padrão, logo e outras definições iniciais (guardadas na tabela settings).
6. Finalização: Gera o ficheiro .env com todas as variáveis, executa as migrações do banco (se necessário) e desabilita o instalador (criando um ficheiro installed.lock ou marcando no banco).

5.2. Tecnologia

O instalador é construído com HTML, CSS e JavaScript puro (sem dependências externas) para garantir que funciona mesmo sem a aplicação estar completamente instalada. Todas as chamadas à API do Supabase são feitas directamente via fetch.

---

6. FIREBASE – FUNCIONALIDADES ESPECÍFICAS

6.1. Notificações Push (FCM)

· Android: O Capacitor utiliza o plugin @capacitor/push-notifications, que se integra com o Firebase Cloud Messaging. O token do dispositivo é registado no backend e associado ao utilizador.
· Web: Através do service worker e do SDK Firebase, as notificações push são recebidas mesmo com a página fechada.
· Backend: O serviço FirebaseService envia notificações para dispositivos específicos ou para tópicos, utilizando a API FCM v1.

6.2. Analytics

O Firebase Analytics é utilizado para recolher dados de uso e comportamento dos utilizadores, com respeito à política de privacidade (GDPR) e com consentimento explícito.

6.3. Crashlytics (opcional)

Para monitorizar erros em produção, especialmente nas aplicações móveis.

---

7. EMPACOTAMENTO MULTIPLATAFORMA (CAPACITOR + ELECTRON)

7.1. Capacitor

O Capacitor 6 é a camada que transforma a aplicação React em aplicações nativas.

· Configuração: capacitor.config.json define appId (mz.carsai.app), appName (Carsai Mozambique) e webDir (frontend/dist).
· Plugins ativos: SplashScreen, StatusBar, Haptics, Device, Preferences, Filesystem, PushNotifications, Keyboard.
· Android: Gera APK (para distribuição directa) e AAB (para Google Play Store). O build é assinado com um keystore próprio.
· iOS: Gera IPA para TestFlight e App Store (necessita de Xcode e macOS).
· Electron: O plugin @capacitor/electron permite construir aplicações desktop para Windows, Linux e macOS, utilizando Electron Builder.

7.2. Electron (Desktop)

O Electron é utilizado para empacotar o frontend React juntamente com um mini-servidor Node.js (ou apenas com o frontend estático). O resultado é um executável nativo para cada sistema operativo.

---

8. WORKFLOWS DO GITHUB ACTIONS (CI/CD)

Os workflows estão definidos em .github/workflows/ e automatizam o ciclo de vida.

8.1. Build Web (build-web.yml)

· Executado a cada push em main ou develop.
· Instala dependências do backend e frontend.
· Executa testes unitários e de integração.
· Builda o frontend com Vite.
· Faz upload do artefato dist para ser usado em deploy.

8.2. Build Android (build-android.yml)

· Disparado por tags v*.*.* ou manualmente.
· Configura Node.js, Java 17 e Android SDK.
· Instala dependências, builda o frontend e sincroniza o Capacitor.
· Decodifica o keystore a partir da secret ANDROID_KEYSTORE_BASE64.
· Gera APK e AAB com gradle assembleRelease e bundleRelease.
· Faz upload dos artefatos.

8.3. Build Desktop (build-desktop.yml)

· Executa em matrix com Ubuntu, Windows e macOS.
· Para cada sistema, builda o frontend, sincroniza o Capacitor com Electron e executa o Electron Builder.
· Gera .exe, .dmg e .AppImage, que são carregados como artefatos.

8.4. Release (release.yml)

· Aguarda os workflows de Android e Desktop.
· Reúne todos os artefatos e cria uma GitHub Release com os ficheiros anexados.

8.5. Deploy Web (deploy-web.yml) – opcional

· Faz deploy automático para um VPS via SSH (rsync) ou para plataformas como Vercel/Netlify.

---

9. VARIAVEIS DE AMBIENTE E SECRETS

9.1. Ficheiro .env (Backend)

```
NODE_ENV=production
PORT=5000

SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

JWT_SECRET=...
JWT_REFRESH_SECRET=...

SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,https://carsai.mz
```

9.2. Variáveis de Ambiente (Frontend – Vite)

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

9.3. Secrets do GitHub (para builds e deploys)

· ANDROID_KEYSTORE_BASE64
· KEYSTORE_PASSWORD
· KEY_ALIAS
· KEY_PASSWORD
· SSH_PRIVATE_KEY (para deploy VPS)
· REMOTE_HOST, REMOTE_USER, REMOTE_TARGET

---

10. INTERNACIONALIZAÇÃO (I18N) – DETALHES AVANÇADOS

10.1. Estrutura dos Ficheiros

Cada idioma é representado por um ficheiro JSON na pasta backend/lang/ e também replicado no frontend (ou carregado via API). Exemplo de pt-br.json:

```json
{
  "welcome": "Bem-vindo ao Carsai Mozambique",
  "hello_user": "Olá, {{name}}!",
  "services": "Serviços",
  "blog": "Blog",
  "forum": "Fórum"
}
```

10.2. Detecção de Idioma

· O backend expõe um endpoint /api/languages que lista todos os ficheiros encontrados em lang/, retornando o código e uma bandeira (mapeada internamente).
· O frontend, ao iniciar, obtém essa lista e armazena no LanguageContext.
· O idioma activo é determinado pela seguinte ordem:
  1. Cookie lang definido pelo utilizador.
  2. Preferência do navegador (Accept-Language).
  3. Idioma padrão definido nas configurações do site (tabela settings).

10.3. Actualização Dinâmica

Sempre que um administrador adiciona um novo ficheiro de idioma no backend, a lista é actualizada automaticamente no frontend após a próxima requisição ao endpoint. O dropdown de selecção de idioma mostra as bandeiras correspondentes, permitindo ao utilizador mudar a qualquer momento.

10.4. Uso no Código

· Backend (Node.js): A função t(key, params) é injectada nos controllers e views (para HTMX).
· Frontend (React): O LanguageContext fornece a função t que acede ao objecto de tradução actual.
· Conteúdo do Banco: Campos com sufixo _pt_br, _en_us para dados multi-idioma (ex: title_pt_br).

---

11. FUNCIONALIDADES POR MÓDULO

11.1. Módulo Público (Institucional)

Páginas estáticas (Home, Sobre, Serviços, Projectos, Contacto, FAQ) com conteúdo editável via painel admin. Os serviços têm ícones, descrição e preço base. Os projectos exibem galeria de imagens, tecnologias, cliente e link de demonstração.

11.2. Módulo Blog

Posts com título, resumo, conteúdo, imagem destacada, autor, data, categorias e tags. Comentários abertos com moderação. Newsletter com captura de emails. Busca interna e sitemap XML.

11.3. Módulo Fórum

Categorias, tópicos e respostas aninhadas. Fixar, bloquear, marcar como resolvido. Likes/upvotes, denúncias e moderação. Perfil do utilizador com histórico de participação.

11.4. Módulo Utilizador (Dashboard)

Gestão de perfil, alteração de senha, preferências de tema e idioma. Histórico de orçamentos, pagamentos e facturas (download PDF). Tickets de suporte. Atividade no fórum. Exportação de dados pessoais.

11.5. Módulo Administrador

Painel com gráficos (Chart.js). Gestão de utilizadores, papéis e permissões. CRUD de páginas, serviços, projectos, posts, categorias e tags. Moderação de comentários e denúncias do fórum. Processamento de orçamentos (criação de propostas, PDF, envio por email). Confirmação de pagamentos e geração de facturas. Configuração do site (SMTP, M-Pesa, idiomas). Gestão de backups e visualização de logs.

11.6. Módulo Parceiro (Partner)

Adicionar projectos ao portfólio (aprovados pelo admin). Link de afiliado único. Estatísticas de cliques e conversões. Comissões geradas e solicitação de saque via M-Pesa/transferência.

11.7. Módulo Financeiro

Orçamentos com anexos. Propostas formais com itens, prazos e valores (PDF). Pagamentos via M-Pesa (API), transferência ou depósito (com comprovante). Facturação automática (PDF) após confirmação. Relatórios de receitas e comissões.

---

12. INSTALAÇÃO E PRIMEIRA EXECUÇÃO

1. Clonar o repositório.
2. Executar npm install no backend e no frontend.
3. Configurar variáveis de ambiente (.env).
4. Executar as migrações do Supabase (ou usar o esquema SQL fornecido).
5. Iniciar o servidor de desenvolvimento: npm run dev em ambas as pastas (ou utilizar o script start na raiz).
6. Aceder ao instalador web (se o sistema ainda não estiver configurado) através de /install.
7. Seguir os passos do wizard para configurar Supabase, Firebase, administrador e definições iniciais.

---

13. TESTES E QUALIDADE

· Unitários: Jest (backend) e Vitest (frontend).
· Integração: Supertest para API; Testing Library para componentes React.
· E2E: Cypress ou Playwright para fluxos completos.
· Cobertura mínima: 80% para código crítico.
· Linting: ESLint com configurações recomendadas; Prettier para formatação.

---

14. DEPLOY EM PRODUÇÃO

14.1. Web

· O backend é executado com PM2 ou em contentor Docker.
· O frontend é servido como ficheiros estáticos (build Vite) através de Nginx (ou pelo próprio Express com express.static).

14.2. Mobile

· Os builds gerados pelos workflows do GitHub são distribuídos via Google Play Store (AAB), Apple App Store (IPA) ou directamente como APK.

14.3. Desktop

· Os executáveis são disponibilizados para download na página de releases do GitHub.

---

15. CONSIDERAÇÕES FINAIS

Esta documentação descreve a arquitetura completa, as tecnologias utilizadas e os fluxos de trabalho para o projecto Carsai Mozambique. A escolha de Supabase como banco de dados e autenticação simplifica a gestão de dados e a escalabilidade. O Firebase complementa com funcionalidades de notificações e analytics, essenciais para uma aplicação moderna. O instalador web garante uma configuração fácil, mesmo para utilizadores não técnicos. A internacionalização dinâmica com bandeiras e detecção automática de idiomas torna a plataforma acessível a um público global. Os workflows de CI/CD automatizam a construção e distribuição para todas as plataformas, garantindo entregas rápidas e consistentes.

---

FIM DA DOCUMENTAÇÃO TÉCNICA