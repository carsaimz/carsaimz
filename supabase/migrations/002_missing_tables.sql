-- Carsai Mozambique - Tabelas Missing (Likes)
-- Execute este SQL no Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/kngwnzvotefivjmaleup/sql

-- Likes em posts do blog
CREATE TABLE IF NOT EXISTS post_likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Likes em comentarios do blog
CREATE TABLE IF NOT EXISTS comment_likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Likes em posts do forum
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON forum_post_likes(user_id);

-- Seed: roles e permissoes (se ainda nao existem)
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Administrador supremo com acesso total ao sistema'),
  ('admin', 'Administrador com acesso a painel de gestao'),
  ('partner', 'Parceiro/afiliado com acesso a dashboard de parceiro'),
  ('user', 'Utilizador regular com acesso a funcionalidades basicas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description) VALUES
  ('admin:full', 'Acesso total ao administrador'),
  ('admin:read', 'Leitura de dados administrativos'),
  ('admin:write', 'Escrita de dados administrativos'),
  ('partner:manage', 'Gerir parceiros e afiliados'),
  ('partner:read', 'Leitura de dados de parceiro'),
  ('user:read', 'Leitura de dados de utilizador'),
  ('user:write', 'Escrita de dados de utilizador'),
  ('forum:post', 'Criar topicos e posts no forum'),
  ('forum:moderate', 'Moderar forum (pin, lock, resolve)'),
  ('blog:write', 'Criar e editar posts no blog'),
  ('blog:comment', 'Comentar em posts do blog')
ON CONFLICT (name) DO NOTHING;

-- Atribuir permissoes ao super_admin
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
