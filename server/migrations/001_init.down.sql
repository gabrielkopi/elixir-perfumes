-- Desfaz a migração 001 (apaga tudo o que ela criou).
DROP TABLE IF EXISTS connect_audit;
DROP TABLE IF EXISTS connect_sessions;
DROP TABLE IF EXISTS store_products;
DROP TABLE IF EXISTS store_members;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS app_state;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS auth_identities;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schema_migrations;
