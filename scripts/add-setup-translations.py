#!/usr/bin/env python3
"""
Add setup/installer translation keys to all 7 translation files.
Also adds common.skip and common.continue keys.
"""

import re
import os

TRANSLATIONS_DIR = '/home/z/my-project/src/lib/translations'

# All setup translations for each language
SETUP_TRANSLATIONS = {
    'pt-pt': {
        'title': 'Carsai Mozambique — Instalação',
        'subtitle': 'Configure o banco de dados, popule dados iniciais e crie o administrador. Este assistente só é necessário na primeira vez.',
        'checking': 'Verificando estado do Firebase...',
        'check': {
            'title': 'Verificação do Firebase',
            'description': 'Verificando a ligação ao Firebase e estado do banco de dados',
            'firebaseConfigured': 'Firebase Configurado',
            'credentialsFound': 'Credenciais encontradas',
            'addCredentials': 'Adicione as credenciais Firebase',
            'firestoreConnected': 'Firestore Conectado',
            'connectionEstablished': 'Ligação estabelecida',
            'couldNotConnect': 'Não foi possível conectar',
            'initialData': 'Dados Iniciais',
            'collectionsWithData': '{count} colecções com dados',
            'needToPopulate': 'Necessário popular dados iniciais',
            'administrator': 'Administrador',
            'adminExists': 'Administrador já existe',
            'needAdmin': 'Necessário criar administrador',
            'notConfigured': 'Firebase não configurado',
            'checkCredentials': 'Verifique se as credenciais Firebase estão correctas em',
        },
        'seed': {
            'title': 'Dados Iniciais',
            'description': 'Popule o banco de dados com roles, permissões, categorias, serviços e configurações padrão. Isto deve ser feito ANTES de criar o administrador.',
            'roles': 'Roles (super_admin, admin, partner, user)',
            'permissions': 'Permissões do sistema',
            'blogCategories': 'Categorias do blog',
            'forumCategories': 'Categorias do fórum',
            'services': 'Serviços',
            'projects': 'Projectos de exemplo',
            'appSettings': 'Configurações da aplicação',
            'creating': 'Criando dados...',
            'populate': 'Popular Banco de Dados',
            'error': 'Erro ao criar dados iniciais. Pode tentar novamente.',
            'created': 'criado(s)',
            'continueToAdmin': 'Continuar para Criar Administrador',
        },
        'admin': {
            'title': 'Criar Administrador',
            'description': 'Crie a conta de super administrador. Esta conta terá acesso total ao painel de administração. Os dados iniciais (roles, permissões) já foram criados no passo anterior.',
            'fullName': 'Nome completo',
            'namePlaceholder': 'Nome do administrador',
            'emailLabel': 'Email',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Senha',
            'passwordPlaceholder': 'Mínimo 8 caracteres',
            'secureAccount': 'Conta segura',
            'secureAccountDesc': 'A senha é armazenada com encriptação do Firebase Auth. O instalador será bloqueado após a criação do administrador.',
            'creating': 'Criando administrador...',
            'createButton': 'Criar Administrador',
            'error': 'Erro ao criar administrador.',
            'emailInUse': 'Este email já está registado no Firebase Auth.',
            'weakPassword': 'Senha demasiado fraca. Use pelo menos 8 caracteres.',
            'invalidEmail': 'Email inválido.',
            'fillAllFields': 'Preencha todos os campos.',
            'passwordMinLength': 'A senha deve ter pelo menos 8 caracteres.',
        },
        'done': {
            'title': 'Instalação Completa!',
            'description': 'O Carsai Mozambique está pronto para usar.',
            'firebaseConfigured': 'Firebase configurado e conectado',
            'dataPopulated': 'Dados iniciais populados',
            'dbReady': 'Banco de dados pronto (sem dados iniciais)',
            'adminCreated': 'Conta de administrador criada',
            'installerLocked': 'Instalador bloqueado (segurança)',
            'nextStep': 'Próximo passo',
            'nextStepDesc': 'Faça login com as credenciais do administrador para acessar o painel de administração.',
            'goToLogin': 'Ir para Login',
        },
        'dbSetup': {
            'title': 'Configuração da Base de Dados',
            'description': 'A base de dados Firestore está vazia. Para que o app funcione correctamente, precisa de dados iniciais (roles, permissões, categorias, etc.).',
            'authRequired': 'Precisa de estar autenticado para inicializar a base de dados. Crie uma conta primeiro.',
            'clickInitialize': 'Clique em "Inicializar" para criar os dados automaticamente.',
            'createAccountFirst': 'Precisa de criar uma conta primeiro antes de inicializar a base de dados.',
            'initializing': 'A inicializar...',
            'initialize': 'Inicializar Dados',
        },
    },
    'en-us': {
        'title': 'Carsai Mozambique — Setup',
        'subtitle': 'Configure the database, populate initial data, and create the administrator. This wizard is only needed the first time.',
        'checking': 'Checking Firebase status...',
        'check': {
            'title': 'Firebase Verification',
            'description': 'Checking Firebase connection and database status',
            'firebaseConfigured': 'Firebase Configured',
            'credentialsFound': 'Credentials found',
            'addCredentials': 'Add Firebase credentials',
            'firestoreConnected': 'Firestore Connected',
            'connectionEstablished': 'Connection established',
            'couldNotConnect': 'Could not connect',
            'initialData': 'Initial Data',
            'collectionsWithData': '{count} collections with data',
            'needToPopulate': 'Need to populate initial data',
            'administrator': 'Administrator',
            'adminExists': 'Administrator already exists',
            'needAdmin': 'Need to create administrator',
            'notConfigured': 'Firebase not configured',
            'checkCredentials': 'Check if Firebase credentials are correct in',
        },
        'seed': {
            'title': 'Initial Data',
            'description': 'Populate the database with roles, permissions, categories, services, and default settings. This must be done BEFORE creating the administrator.',
            'roles': 'Roles (super_admin, admin, partner, user)',
            'permissions': 'System permissions',
            'blogCategories': 'Blog categories',
            'forumCategories': 'Forum categories',
            'services': 'Services',
            'projects': 'Sample projects',
            'appSettings': 'Application settings',
            'creating': 'Creating data...',
            'populate': 'Populate Database',
            'error': 'Error creating initial data. You can try again.',
            'created': 'created',
            'continueToAdmin': 'Continue to Create Administrator',
        },
        'admin': {
            'title': 'Create Administrator',
            'description': 'Create the super administrator account. This account will have full access to the administration panel. Initial data (roles, permissions) was already created in the previous step.',
            'fullName': 'Full name',
            'namePlaceholder': 'Administrator name',
            'emailLabel': 'Email',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Password',
            'passwordPlaceholder': 'Minimum 8 characters',
            'secureAccount': 'Secure account',
            'secureAccountDesc': 'The password is stored with Firebase Auth encryption. The installer will be locked after creating the administrator.',
            'creating': 'Creating administrator...',
            'createButton': 'Create Administrator',
            'error': 'Error creating administrator.',
            'emailInUse': 'This email is already registered in Firebase Auth.',
            'weakPassword': 'Password too weak. Use at least 8 characters.',
            'invalidEmail': 'Invalid email.',
            'fillAllFields': 'Fill in all fields.',
            'passwordMinLength': 'Password must be at least 8 characters.',
        },
        'done': {
            'title': 'Setup Complete!',
            'description': 'Carsai Mozambique is ready to use.',
            'firebaseConfigured': 'Firebase configured and connected',
            'dataPopulated': 'Initial data populated',
            'dbReady': 'Database ready (no initial data)',
            'adminCreated': 'Administrator account created',
            'installerLocked': 'Installer locked (security)',
            'nextStep': 'Next step',
            'nextStepDesc': 'Log in with the administrator credentials to access the administration panel.',
            'goToLogin': 'Go to Login',
        },
        'dbSetup': {
            'title': 'Database Setup',
            'description': 'The Firestore database is empty. For the app to work correctly, it needs initial data (roles, permissions, categories, etc.).',
            'authRequired': 'You need to be authenticated to initialize the database. Create an account first.',
            'clickInitialize': 'Click "Initialize" to create the data automatically.',
            'createAccountFirst': 'You need to create an account first before initializing the database.',
            'initializing': 'Initializing...',
            'initialize': 'Initialize Data',
        },
    },
    'pt-br': {
        'title': 'Carsai Mozambique — Instalação',
        'subtitle': 'Configure o banco de dados, popule dados iniciais e crie o administrador. Este assistente só é necessário na primeira vez.',
        'checking': 'Verificando estado do Firebase...',
        'check': {
            'title': 'Verificação do Firebase',
            'description': 'Verificando a conexão ao Firebase e estado do banco de dados',
            'firebaseConfigured': 'Firebase Configurado',
            'credentialsFound': 'Credenciais encontradas',
            'addCredentials': 'Adicione as credenciais Firebase',
            'firestoreConnected': 'Firestore Conectado',
            'connectionEstablished': 'Conexão estabelecida',
            'couldNotConnect': 'Não foi possível conectar',
            'initialData': 'Dados Iniciais',
            'collectionsWithData': '{count} coleções com dados',
            'needToPopulate': 'Necessário popular dados iniciais',
            'administrator': 'Administrador',
            'adminExists': 'Administrador já existe',
            'needAdmin': 'Necessário criar administrador',
            'notConfigured': 'Firebase não configurado',
            'checkCredentials': 'Verifique se as credenciais Firebase estão corretas em',
        },
        'seed': {
            'title': 'Dados Iniciais',
            'description': 'Popule o banco de dados com roles, permissões, categorias, serviços e configurações padrão. Isso deve ser feito ANTES de criar o administrador.',
            'roles': 'Roles (super_admin, admin, partner, user)',
            'permissions': 'Permissões do sistema',
            'blogCategories': 'Categorias do blog',
            'forumCategories': 'Categorias do fórum',
            'services': 'Serviços',
            'projects': 'Projetos de exemplo',
            'appSettings': 'Configurações da aplicação',
            'creating': 'Criando dados...',
            'populate': 'Popular Banco de Dados',
            'error': 'Erro ao criar dados iniciais. Pode tentar novamente.',
            'created': 'criado(s)',
            'continueToAdmin': 'Continuar para Criar Administrador',
        },
        'admin': {
            'title': 'Criar Administrador',
            'description': 'Crie a conta de super administrador. Esta conta terá acesso total ao painel de administração. Os dados iniciais (roles, permissões) já foram criados no passo anterior.',
            'fullName': 'Nome completo',
            'namePlaceholder': 'Nome do administrador',
            'emailLabel': 'Email',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Senha',
            'passwordPlaceholder': 'Mínimo 8 caracteres',
            'secureAccount': 'Conta segura',
            'secureAccountDesc': 'A senha é armazenada com criptografia do Firebase Auth. O instalador será bloqueado após a criação do administrador.',
            'creating': 'Criando administrador...',
            'createButton': 'Criar Administrador',
            'error': 'Erro ao criar administrador.',
            'emailInUse': 'Este email já está registrado no Firebase Auth.',
            'weakPassword': 'Senha demasiado fraca. Use pelo menos 8 caracteres.',
            'invalidEmail': 'Email inválido.',
            'fillAllFields': 'Preencha todos os campos.',
            'passwordMinLength': 'A senha deve ter pelo menos 8 caracteres.',
        },
        'done': {
            'title': 'Instalação Completa!',
            'description': 'O Carsai Mozambique está pronto para usar.',
            'firebaseConfigured': 'Firebase configurado e conectado',
            'dataPopulated': 'Dados iniciais populados',
            'dbReady': 'Banco de dados pronto (sem dados iniciais)',
            'adminCreated': 'Conta de administrador criada',
            'installerLocked': 'Instalador bloqueado (segurança)',
            'nextStep': 'Próximo passo',
            'nextStepDesc': 'Faça login com as credenciais do administrador para acessar o painel de administração.',
            'goToLogin': 'Ir para Login',
        },
        'dbSetup': {
            'title': 'Configuração do Banco de Dados',
            'description': 'O banco de dados Firestore está vazio. Para que o app funcione corretamente, precisa de dados iniciais (roles, permissões, categorias, etc.).',
            'authRequired': 'Você precisa estar autenticado para inicializar o banco de dados. Crie uma conta primeiro.',
            'clickInitialize': 'Clique em "Inicializar" para criar os dados automaticamente.',
            'createAccountFirst': 'Você precisa criar uma conta primeiro antes de inicializar o banco de dados.',
            'initializing': 'Inicializando...',
            'initialize': 'Inicializar Dados',
        },
    },
    'fr-fr': {
        'title': 'Carsai Mozambique — Installation',
        'subtitle': 'Configurez la base de données, remplissez les données initiales et créez l\'administrateur. Cet assistant n\'est nécessaire que la première fois.',
        'checking': 'Vérification de l\'état Firebase...',
        'check': {
            'title': 'Vérification Firebase',
            'description': 'Vérification de la connexion Firebase et de l\'état de la base de données',
            'firebaseConfigured': 'Firebase Configuré',
            'credentialsFound': 'Identifiants trouvés',
            'addCredentials': 'Ajoutez les identifiants Firebase',
            'firestoreConnected': 'Firestore Connecté',
            'connectionEstablished': 'Connexion établie',
            'couldNotConnect': 'Impossible de se connecter',
            'initialData': 'Données Initiales',
            'collectionsWithData': '{count} collections avec des données',
            'needToPopulate': 'Besoin de remplir les données initiales',
            'administrator': 'Administrateur',
            'adminExists': 'L\'administrateur existe déjà',
            'needAdmin': 'Besoin de créer un administrateur',
            'notConfigured': 'Firebase non configuré',
            'checkCredentials': 'Vérifiez que les identifiants Firebase sont corrects dans',
        },
        'seed': {
            'title': 'Données Initiales',
            'description': 'Remplissez la base de données avec les rôles, permissions, catégories, services et paramètres par défaut. Cela doit être fait AVANT de créer l\'administrateur.',
            'roles': 'Rôles (super_admin, admin, partner, user)',
            'permissions': 'Permissions du système',
            'blogCategories': 'Catégories du blog',
            'forumCategories': 'Catégories du forum',
            'services': 'Services',
            'projects': 'Projets exemples',
            'appSettings': 'Paramètres de l\'application',
            'creating': 'Création des données...',
            'populate': 'Remplir la Base de Données',
            'error': 'Erreur lors de la création des données initiales. Vous pouvez réessayer.',
            'created': 'créé(s)',
            'continueToAdmin': 'Continuer pour Créer l\'Administrateur',
        },
        'admin': {
            'title': 'Créer l\'Administrateur',
            'description': 'Créez le compte super administrateur. Ce compte aura un accès total au panneau d\'administration. Les données initiales (rôles, permissions) ont déjà été créées à l\'étape précédente.',
            'fullName': 'Nom complet',
            'namePlaceholder': 'Nom de l\'administrateur',
            'emailLabel': 'Email',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Mot de passe',
            'passwordPlaceholder': 'Minimum 8 caractères',
            'secureAccount': 'Compte sécurisé',
            'secureAccountDesc': 'Le mot de passe est stocké avec le chiffrement Firebase Auth. L\'installateur sera verrouillé après la création de l\'administrateur.',
            'creating': 'Création de l\'administrateur...',
            'createButton': 'Créer l\'Administrateur',
            'error': 'Erreur lors de la création de l\'administrateur.',
            'emailInUse': 'Cet email est déjà enregistré dans Firebase Auth.',
            'weakPassword': 'Mot de passe trop faible. Utilisez au moins 8 caractères.',
            'invalidEmail': 'Email invalide.',
            'fillAllFields': 'Remplissez tous les champs.',
            'passwordMinLength': 'Le mot de passe doit contenir au moins 8 caractères.',
        },
        'done': {
            'title': 'Installation Terminée !',
            'description': 'Carsai Mozambique est prêt à être utilisé.',
            'firebaseConfigured': 'Firebase configuré et connecté',
            'dataPopulated': 'Données initiales remplies',
            'dbReady': 'Base de données prête (sans données initiales)',
            'adminCreated': 'Compte administrateur créé',
            'installerLocked': 'Installateur verrouillé (sécurité)',
            'nextStep': 'Prochaine étape',
            'nextStepDesc': 'Connectez-vous avec les identifiants de l\'administrateur pour accéder au panneau d\'administration.',
            'goToLogin': 'Aller à la Connexion',
        },
        'dbSetup': {
            'title': 'Configuration de la Base de Données',
            'description': 'La base de données Firestore est vide. Pour que l\'application fonctionne correctement, elle a besoin de données initiales (rôles, permissions, catégories, etc.).',
            'authRequired': 'Vous devez être authentifié pour initialiser la base de données. Créez un compte d\'abord.',
            'clickInitialize': 'Cliquez sur "Initialiser" pour créer les données automatiquement.',
            'createAccountFirst': 'Vous devez créer un compte d\'abord avant d\'initialiser la base de données.',
            'initializing': 'Initialisation...',
            'initialize': 'Initialiser les Données',
        },
    },
    'es-es': {
        'title': 'Carsai Mozambique — Instalación',
        'subtitle': 'Configure la base de datos, rellene los datos iniciales y cree el administrador. Este asistente solo es necesario la primera vez.',
        'checking': 'Verificando estado de Firebase...',
        'check': {
            'title': 'Verificación de Firebase',
            'description': 'Verificando la conexión a Firebase y el estado de la base de datos',
            'firebaseConfigured': 'Firebase Configurado',
            'credentialsFound': 'Credenciales encontradas',
            'addCredentials': 'Agregue las credenciales Firebase',
            'firestoreConnected': 'Firestore Conectado',
            'connectionEstablished': 'Conexión establecida',
            'couldNotConnect': 'No se pudo conectar',
            'initialData': 'Datos Iniciales',
            'collectionsWithData': '{count} colecciones con datos',
            'needToPopulate': 'Necesario rellenar datos iniciales',
            'administrator': 'Administrador',
            'adminExists': 'El administrador ya existe',
            'needAdmin': 'Necesario crear administrador',
            'notConfigured': 'Firebase no configurado',
            'checkCredentials': 'Verifique que las credenciales Firebase sean correctas en',
        },
        'seed': {
            'title': 'Datos Iniciales',
            'description': 'Rellene la base de datos con roles, permisos, categorías, servicios y configuraciones predeterminadas. Esto debe hacerse ANTES de crear el administrador.',
            'roles': 'Roles (super_admin, admin, partner, user)',
            'permissions': 'Permisos del sistema',
            'blogCategories': 'Categorías del blog',
            'forumCategories': 'Categorías del foro',
            'services': 'Servicios',
            'projects': 'Proyectos de ejemplo',
            'appSettings': 'Configuración de la aplicación',
            'creating': 'Creando datos...',
            'populate': 'Rellenar Base de Datos',
            'error': 'Error al crear datos iniciales. Puede intentarlo de nuevo.',
            'created': 'creado(s)',
            'continueToAdmin': 'Continuar para Crear Administrador',
        },
        'admin': {
            'title': 'Crear Administrador',
            'description': 'Cree la cuenta de super administrador. Esta cuenta tendrá acceso total al panel de administración. Los datos iniciales (roles, permisos) ya se crearon en el paso anterior.',
            'fullName': 'Nombre completo',
            'namePlaceholder': 'Nombre del administrador',
            'emailLabel': 'Email',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Contraseña',
            'passwordPlaceholder': 'Mínimo 8 caracteres',
            'secureAccount': 'Cuenta segura',
            'secureAccountDesc': 'La contraseña se almacena con cifrado de Firebase Auth. El instalador se bloqueará después de crear el administrador.',
            'creating': 'Creando administrador...',
            'createButton': 'Crear Administrador',
            'error': 'Error al crear el administrador.',
            'emailInUse': 'Este email ya está registrado en Firebase Auth.',
            'weakPassword': 'Contraseña demasiado débil. Use al menos 8 caracteres.',
            'invalidEmail': 'Email inválido.',
            'fillAllFields': 'Rellene todos los campos.',
            'passwordMinLength': 'La contraseña debe tener al menos 8 caracteres.',
        },
        'done': {
            'title': '¡Instalación Completa!',
            'description': 'Carsai Mozambique está listo para usar.',
            'firebaseConfigured': 'Firebase configurado y conectado',
            'dataPopulated': 'Datos iniciales rellenados',
            'dbReady': 'Base de datos lista (sin datos iniciales)',
            'adminCreated': 'Cuenta de administrador creada',
            'installerLocked': 'Instalador bloqueado (seguridad)',
            'nextStep': 'Siguiente paso',
            'nextStepDesc': 'Inicie sesión con las credenciales del administrador para acceder al panel de administración.',
            'goToLogin': 'Ir a Iniciar Sesión',
        },
        'dbSetup': {
            'title': 'Configuración de la Base de Datos',
            'description': 'La base de datos Firestore está vacía. Para que la aplicación funcione correctamente, necesita datos iniciales (roles, permisos, categorías, etc.).',
            'authRequired': 'Necesita estar autenticado para inicializar la base de datos. Cree una cuenta primero.',
            'clickInitialize': 'Haga clic en "Inicializar" para crear los datos automáticamente.',
            'createAccountFirst': 'Necesita crear una cuenta primero antes de inicializar la base de datos.',
            'initializing': 'Inicializando...',
            'initialize': 'Inicializar Datos',
        },
    },
    'zh-cn': {
        'title': 'Carsai Mozambique — 安装',
        'subtitle': '配置数据库、填充初始数据并创建管理员。此向导仅在首次使用时需要。',
        'checking': '正在检查 Firebase 状态...',
        'check': {
            'title': 'Firebase 验证',
            'description': '正在检查 Firebase 连接和数据库状态',
            'firebaseConfigured': 'Firebase 已配置',
            'credentialsFound': '已找到凭据',
            'addCredentials': '请添加 Firebase 凭据',
            'firestoreConnected': 'Firestore 已连接',
            'connectionEstablished': '连接已建立',
            'couldNotConnect': '无法连接',
            'initialData': '初始数据',
            'collectionsWithData': '{count} 个集合包含数据',
            'needToPopulate': '需要填充初始数据',
            'administrator': '管理员',
            'adminExists': '管理员已存在',
            'needAdmin': '需要创建管理员',
            'notConfigured': 'Firebase 未配置',
            'checkCredentials': '请检查 Firebase 凭据是否正确',
        },
        'seed': {
            'title': '初始数据',
            'description': '用角色、权限、分类、服务和默认设置填充数据库。此步骤必须在创建管理员之前完成。',
            'roles': '角色 (super_admin, admin, partner, user)',
            'permissions': '系统权限',
            'blogCategories': '博客分类',
            'forumCategories': '论坛分类',
            'services': '服务',
            'projects': '示例项目',
            'appSettings': '应用设置',
            'creating': '正在创建数据...',
            'populate': '填充数据库',
            'error': '创建初始数据时出错。请重试。',
            'created': '已创建',
            'continueToAdmin': '继续创建管理员',
        },
        'admin': {
            'title': '创建管理员',
            'description': '创建超级管理员账户。此账户将拥有管理面板的完全访问权限。初始数据（角色、权限）已在上一步中创建。',
            'fullName': '全名',
            'namePlaceholder': '管理员名称',
            'emailLabel': '邮箱',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': '密码',
            'passwordPlaceholder': '至少8个字符',
            'secureAccount': '安全账户',
            'secureAccountDesc': '密码使用 Firebase Auth 加密存储。创建管理员后，安装程序将被锁定。',
            'creating': '正在创建管理员...',
            'createButton': '创建管理员',
            'error': '创建管理员时出错。',
            'emailInUse': '此邮箱已在 Firebase Auth 中注册。',
            'weakPassword': '密码太弱。请使用至少8个字符。',
            'invalidEmail': '邮箱无效。',
            'fillAllFields': '请填写所有字段。',
            'passwordMinLength': '密码必须至少8个字符。',
        },
        'done': {
            'title': '安装完成！',
            'description': 'Carsai Mozambique 已准备就绪。',
            'firebaseConfigured': 'Firebase 已配置并连接',
            'dataPopulated': '初始数据已填充',
            'dbReady': '数据库已就绪（无初始数据）',
            'adminCreated': '管理员账户已创建',
            'installerLocked': '安装程序已锁定（安全）',
            'nextStep': '下一步',
            'nextStepDesc': '使用管理员凭据登录以访问管理面板。',
            'goToLogin': '前往登录',
        },
        'dbSetup': {
            'title': '数据库设置',
            'description': 'Firestore 数据库为空。为使应用正常运行，需要初始数据（角色、权限、分类等）。',
            'authRequired': '您需要先通过身份验证才能初始化数据库。请先创建账户。',
            'clickInitialize': '点击"初始化"以自动创建数据。',
            'createAccountFirst': '您需要先创建账户才能初始化数据库。',
            'initializing': '正在初始化...',
            'initialize': '初始化数据',
        },
    },
    'de-de': {
        'title': 'Carsai Mozambique — Installation',
        'subtitle': 'Konfigurieren Sie die Datenbank, füllen Sie Anfangsdaten und erstellen Sie den Administrator. Dieser Assistent ist nur beim ersten Mal erforderlich.',
        'checking': 'Firebase-Status wird überprüft...',
        'check': {
            'title': 'Firebase-Überprüfung',
            'description': 'Überprüfung der Firebase-Verbindung und des Datenbankstatus',
            'firebaseConfigured': 'Firebase Konfiguriert',
            'credentialsFound': 'Anmeldedaten gefunden',
            'addCredentials': 'Firebase-Anmeldedaten hinzufügen',
            'firestoreConnected': 'Firestore Verbunden',
            'connectionEstablished': 'Verbindung hergestellt',
            'couldNotConnect': 'Verbindung nicht möglich',
            'initialData': 'Anfangsdaten',
            'collectionsWithData': '{count} Sammlungen mit Daten',
            'needToPopulate': 'Anfangsdaten müssen gefüllt werden',
            'administrator': 'Administrator',
            'adminExists': 'Administrator existiert bereits',
            'needAdmin': 'Administrator muss erstellt werden',
            'notConfigured': 'Firebase nicht konfiguriert',
            'checkCredentials': 'Überprüfen Sie, ob die Firebase-Anmeldedaten korrekt sind in',
        },
        'seed': {
            'title': 'Anfangsdaten',
            'description': 'Füllen Sie die Datenbank mit Rollen, Berechtigungen, Kategorien, Diensten und Standardeinstellungen. Dies muss VOR dem Erstellen des Administrators erfolgen.',
            'roles': 'Rollen (super_admin, admin, partner, user)',
            'permissions': 'Systemberechtigungen',
            'blogCategories': 'Blog-Kategorien',
            'forumCategories': 'Forum-Kategorien',
            'services': 'Dienste',
            'projects': 'Beispielprojekte',
            'appSettings': 'Anwendungseinstellungen',
            'creating': 'Daten werden erstellt...',
            'populate': 'Datenbank Füllen',
            'error': 'Fehler beim Erstellen der Anfangsdaten. Sie können es erneut versuchen.',
            'created': 'erstellt',
            'continueToAdmin': 'Weiter zum Administrator Erstellen',
        },
        'admin': {
            'title': 'Administrator Erstellen',
            'description': 'Erstellen Sie das Super-Administratorkonto. Dieses Konto hat vollen Zugriff auf das Administrationspanel. Die Anfangsdaten (Rollen, Berechtigungen) wurden im vorherigen Schritt bereits erstellt.',
            'fullName': 'Vollständiger Name',
            'namePlaceholder': 'Administratorname',
            'emailLabel': 'E-Mail',
            'emailPlaceholder': 'admin@carsai.mz',
            'passwordLabel': 'Passwort',
            'passwordPlaceholder': 'Mindestens 8 Zeichen',
            'secureAccount': 'Sicheres Konto',
            'secureAccountDesc': 'Das Passwort wird mit Firebase Auth-Verschlüsselung gespeichert. Das Installationsprogramm wird nach der Erstellung des Administrators gesperrt.',
            'creating': 'Administrator wird erstellt...',
            'createButton': 'Administrator Erstellen',
            'error': 'Fehler beim Erstellen des Administrators.',
            'emailInUse': 'Diese E-Mail ist bereits in Firebase Auth registriert.',
            'weakPassword': 'Passwort zu schwach. Verwenden Sie mindestens 8 Zeichen.',
            'invalidEmail': 'Ungültige E-Mail.',
            'fillAllFields': 'Füllen Sie alle Felder aus.',
            'passwordMinLength': 'Das Passwort muss mindestens 8 Zeichen lang sein.',
        },
        'done': {
            'title': 'Installation Abgeschlossen!',
            'description': 'Carsai Mozambique ist einsatzbereit.',
            'firebaseConfigured': 'Firebase konfiguriert und verbunden',
            'dataPopulated': 'Anfangsdaten gefüllt',
            'dbReady': 'Datenbank bereit (keine Anfangsdaten)',
            'adminCreated': 'Administratorkonto erstellt',
            'installerLocked': 'Installationsprogramm gesperrt (Sicherheit)',
            'nextStep': 'Nächster Schritt',
            'nextStepDesc': 'Melden Sie sich mit den Administrator-Anmeldedaten an, um auf das Administrationspanel zuzugreifen.',
            'goToLogin': 'Zum Login',
        },
        'dbSetup': {
            'title': 'Datenbank-Einrichtung',
            'description': 'Die Firestore-Datenbank ist leer. Damit die App ordnungsgemäß funktioniert, werden Anfangsdaten benötigt (Rollen, Berechtigungen, Kategorien usw.).',
            'authRequired': 'Sie müssen angemeldet sein, um die Datenbank zu initialisieren. Erstellen Sie zuerst ein Konto.',
            'clickInitialize': 'Klicken Sie auf "Initialisieren", um die Daten automatisch zu erstellen.',
            'createAccountFirst': 'Sie müssen zuerst ein Konto erstellen, bevor Sie die Datenbank initialisieren können.',
            'initializing': 'Initialisierung...',
            'initialize': 'Daten Initialisieren',
        },
    },
}

# Common keys to add
COMMON_KEYS = {
    'pt-pt': {'skip': 'Saltar', 'continue': 'Continuar'},
    'en-us': {'skip': 'Skip', 'continue': 'Continue'},
    'pt-br': {'skip': 'Pular', 'continue': 'Continuar'},
    'fr-fr': {'skip': 'Passer', 'continue': 'Continuer'},
    'es-es': {'skip': 'Saltar', 'continue': 'Continuar'},
    'zh-cn': {'skip': '跳过', 'continue': '继续'},
    'de-de': {'skip': 'Überspringen', 'continue': 'Weiter'},
}


def dict_to_ts_literal(d, indent=4):
    """Convert a Python dict to a TypeScript object literal string."""
    prefix = ' ' * indent
    inner_prefix = ' ' * (indent + 2)
    lines = ['{']
    for key, value in d.items():
        if isinstance(value, dict):
            sub = dict_to_ts_literal(value, indent + 2)
            lines.append(f"{inner_prefix}{key}: {sub},")
        else:
            # Escape single quotes in values
            escaped = value.replace("'", "\\'")
            lines.append(f"{inner_prefix}{key}: '{escaped}',")
    lines.append(f"{prefix}}}")
    return '\n'.join(lines)


def add_common_keys(content, lang_code, keys):
    """Add common.skip and common.continue to the common section."""
    # Find the common section closing brace
    # We need to find the last key in common section and add after it
    common_keys_to_add = keys
    
    # Find the common section
    common_match = re.search(r'  common: \{', content)
    if not common_match:
        print(f"  WARNING: Could not find common section in {lang_code}")
        return content
    
    # Find the end of common section - look for the closing brace at the right indentation
    # We need to find the pattern:  },\n\n  // or  },\n\n  nextSection
    start_pos = common_match.end()
    
    # Find the closing brace of common section
    depth = 1
    pos = start_pos
    while depth > 0 and pos < len(content):
        if content[pos] == '{':
            depth += 1
        elif content[pos] == '}':
            depth -= 1
        pos += 1
    
    common_end = pos - 1  # Position of the closing }
    
    # Get the content of the common section
    common_content = content[common_match.start():common_end + 1]
    
    # Check if keys already exist
    for key, value in common_keys_to_add.items():
        key_pattern = f"{key}:"
        if key_pattern not in common_content:
            # Add the key before the closing brace
            # Find the last key-value pair (before the closing brace)
            # Insert before the closing }
            insert_pos = common_end
            escaped = value.replace("'", "\\'")
            new_line = f"\n    {key}: '{escaped}',"
            content = content[:insert_pos] + new_line + content[insert_pos:]
    
    return content


def add_setup_section(content, lang_code, setup_data):
    """Add the setup section before the loading section."""
    setup_ts = dict_to_ts_literal(setup_data, 2)
    
    setup_section = f"""
  // ============================================================================
  // Setup / Installer
  // ============================================================================
  setup: {setup_ts},
"""
    
    # Find the loading section and insert before it
    loading_pattern = '\n  // ============\n  loading: {'
    loading_match = re.search(r'\n  // ={10,}\n  loading: \{', content)
    
    if loading_match:
        insert_pos = content.rfind('\n  // =', 0, loading_match.start())
        if insert_pos == -1:
            insert_pos = loading_match.start()
        content = content[:insert_pos] + setup_section + content[insert_pos:]
    else:
        # Fallback: insert before the closing };
        content = content.rstrip()
        if content.endswith('};'):
            content = content[:-2] + setup_section + '\n};'
    
    return content


def process_file(lang_code):
    """Process a single translation file."""
    filename_map = {
        'pt-pt': 'pt-pt.ts',
        'en-us': 'en-us.ts',
        'pt-br': 'pt-br.ts',
        'fr-fr': 'fr-fr.ts',
        'es-es': 'es-es.ts',
        'zh-cn': 'zh-cn.ts',
        'de-de': 'de-de.ts',
    }
    
    filename = filename_map[lang_code]
    filepath = os.path.join(TRANSLATIONS_DIR, filename)
    
    print(f"Processing {filename}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add common keys
    content = add_common_keys(content, lang_code, COMMON_KEYS[lang_code])
    
    # Add setup section
    content = add_setup_section(content, lang_code, SETUP_TRANSLATIONS[lang_code])
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ {filename} updated")


def main():
    for lang_code in SETUP_TRANSLATIONS.keys():
        process_file(lang_code)
    print("\nAll translation files updated!")


if __name__ == '__main__':
    main()
