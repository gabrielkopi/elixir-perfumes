-- ELIXIR · API híbrida · migração 001 (reversível: 001_init.down.sql)
-- Contas, sessões, estado sincronizado do app, lojas e ELIXIR Connect com auditoria.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,          -- sempre em minúsculas
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  handle        TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login social (Google/Apple) futuro: a identidade externa aponta para o usuário.
CREATE TABLE auth_identities (
  provider    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject)
);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,            -- sha256 do token; o token em si nunca é guardado
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX sessions_user ON sessions(user_id);

-- Estado do app (o mesmo objeto v3 do navegador), com revisão para detectar conflito entre aparelhos.
CREATE TABLE app_state (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state       JSONB NOT NULL,
  revision    INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stores (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_members (
  store_id    TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner','staff')),
  PRIMARY KEY (store_id, user_id)
);

-- Estoque verificado: só entra quem a loja confirmou, com data (validade temporal).
CREATE TABLE store_products (
  store_id    TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  perfume_id  TEXT NOT NULL,
  in_stock    BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, perfume_id)
);

-- Sessão do Connect: o resumo (payload) só existe enquanto a sessão vale; revogar ou expirar apaga o resumo.
CREATE TABLE connect_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash    TEXT NOT NULL UNIQUE,           -- sha256 do código do QR
  scopes       JSONB NOT NULL,
  payload      JSONB,
  store_id     TEXT REFERENCES stores(id) ON DELETE SET NULL,
  status       TEXT NOT NULL CHECK (status IN ('pending','claimed','active','revoked','expired')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consented_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);
CREATE INDEX connect_user ON connect_sessions(user_id);

-- Auditoria sem dados pessoais: quem (id), o quê e quando.
CREATE TABLE connect_audit (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  store_id    TEXT,
  actor_id    TEXT,
  action      TEXT NOT NULL,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX connect_audit_session ON connect_audit(session_id);

CREATE TABLE schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
