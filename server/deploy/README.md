# ELIXIR · instalar a API no servidor da Prakyer

A API é pequena: contas (e-mail e senha), sincronização do perfil entre aparelhos, exportar e apagar dados (LGPD) e o ELIXIR Connect, com sessão temporária, consentimento, revogação, isolamento por loja e auditoria. O site continua no GitHub Pages e só chama a API.

## O que precisa existir no servidor
- Docker com Compose, **ou** Node 20+ com Postgres 14+.
- Um subdomínio apontando para o servidor, por exemplo `api.dominio.com`, para ter HTTPS. Sem HTTPS, o site publicado (https) não consegue chamar a API.
- Nginx, Caddy ou outro proxy na frente, com um arquivo **novo** só para a API.

## Passo a passo (Docker)
1. Copie a pasta `server/` do repositório para `/srv/elixir-api`:
   ```bash
   git clone https://github.com/gabrielkopi/elixir-perfumes.git /srv/elixir-src && cp -r /srv/elixir-src/server /srv/elixir-api
   ```
2. Crie o `.env` a partir do `.env.example`, com uma senha longa:
   ```bash
   cd /srv/elixir-api && cp .env.example .env && openssl rand -base64 32
   ```
3. Suba os containers:
   ```bash
   cd /srv/elixir-api/deploy && docker compose --env-file ../.env up -d --build
   ```
4. Confira a API: `curl -s http://127.0.0.1:8787/api/health` deve responder `{"ok":true,...}`.
5. Configure o proxy. Copie `deploy/nginx-elixir-api.conf` para `/etc/nginx/sites-available/elixir-api`, troque `api.SEU-DOMINIO` e gere o certificado:
   ```bash
   certbot certonly --webroot -w /var/www/certbot -d api.SEU-DOMINIO
   ```
   Depois rode `nginx -t` e **reload**, nunca restart.
6. No site, preencha `<meta name="elixir-api" content="https://api.SEU-DOMINIO">` nas páginas (index, elixir, perfume-social, assinatura) e publique. Com isso aparece "Entrar com e-mail" na tela de perfis.

## Verificar a migração
- `docker compose exec api node src/migrate.js down` desfaz.
- `docker compose exec api node src/migrate.js up` aplica de novo.
- Em memória (pg-mem) só dá para provar que o `down` apaga as tabelas. A reaplicação no mesmo banco precisa ser conferida no Postgres real.

## Lojas do Connect
Uma loja e o atendente se criam direto no banco, até existir o painel administrativo:
```sql
INSERT INTO stores (id, name) VALUES ('loja-centro', 'Perfumaria Centro');
INSERT INTO store_members (store_id, user_id, role) VALUES ('loja-centro', '<id do usuário atendente>', 'staff');
INSERT INTO store_products (store_id, perfume_id, in_stock) VALUES ('loja-centro', 'vetiver', TRUE);
```
O estoque só entra quando a loja confirma, e cada item guarda a data da confirmação.

## Segurança
- Senhas guardadas com scrypt. Tokens guardados só como hash. Sessões expiram em 30 dias.
- CORS só para as origens do `.env`. Limite de tentativas no login e no cadastro.
- O resumo do Connect é apagado quando a sessão expira ou é revogada. A auditoria guarda ids e ações, não dados pessoais.
- Login com Google ou Apple depende de credenciais do dono (Google Cloud e Apple Developer). A tabela `auth_identities` já está pronta para isso.
