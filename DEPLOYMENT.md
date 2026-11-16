# Publicação: Vercel + Supabase

O Vercel hospeda a interface e a API serverless. O Supabase fornece o PostgreSQL; a aplicação usa a API Node existente, sem expor credenciais do banco no navegador.

## 1. Preparar o Supabase

1. Abra o projeto Supabase e execute `supabase/migrations/20261106225828_production_storage.sql` no SQL Editor. A migração cria o schema privado e a role `tripsplit_api`, com login e sem privilégios de superusuário.
2. Defina uma senha para `tripsplit_api` no Supabase e guarde-a num gerenciador de segredos. Se já executou a versão anterior da migração, execute `ALTER ROLE tripsplit_api WITH LOGIN;` no SQL Editor.
3. Em **Connect**, escolha o **Transaction pooler** e monte `DATABASE_URL` com o host e a porta fornecidos pelo Supabase, banco `postgres`, usuário `tripsplit_api.<PROJECT_REF>` e a senha dessa role. Não use a senha do usuário `postgres`.

## 2. Preparar o Vercel

1. Importe o repositório GitHub `k4duzer4/tripsplit1` como um projeto Vercel. O `vercel.json` já define o build Vite, a pasta `dist`, a função `/api` e o fallback da SPA.
2. Configure estas variáveis para **Production** (e também Preview se quiser validar previews):

   - `DATABASE_URL`: conexão do Transaction pooler com a role `tripsplit_api`.
   - `APP_URL`: URL HTTPS final do projeto, sem barra no fim; ela é usada em CORS e nos links de redefinição de senha.
   - `RESEND_API_KEY` e `EMAIL_FROM`: necessários para cadastro, reenvio de código e redefinição de senha em produção. O remetente precisa estar verificado no Resend.

3. Não configure `VITE_` na URL do banco nem publique `.env.production.local`. Não é necessário definir `NODE_ENV`; o Vercel define o ambiente de produção.
4. Faça o deploy e valide `https://SEU_DOMINIO/api/health`, cadastro por e-mail, login, criação de viagem e persistência após novo deploy.

## 3. Variáveis locais

`.env.production.local` é ignorado pelo Git. Use-o apenas localmente para testar a conexão. Nunca cole os valores secretos em commits, issues ou logs. O frontend já chama `/api` no mesmo domínio em produção.
