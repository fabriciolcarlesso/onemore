# Plataforma de Personal e Alunos

Base inicial de uma aplicação web criada com Next.js, App Router, TypeScript e Tailwind CSS.

## Rodando localmente

Requisito: Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Comandos disponíveis

```bash
npm run dev    # ambiente de desenvolvimento
npm run build  # build de produção
npm run start  # executa o build de produção
npm run lint   # verifica o código com ESLint
```

## Banco de dados

O projeto usa PostgreSQL no Neon com Drizzle ORM. Após vincular o projeto à
Vercel, sincronize as variáveis locais:

```bash
npx vercel env pull .env.local
```

Comandos para administrar o schema:

```bash
npm run db:generate # gera uma migration a partir de db/schema.ts
npm run db:migrate  # aplica as migrations pendentes
npm run db:check    # valida o histórico de migrations
npm run db:studio   # abre o gerenciador visual do Drizzle
```

Os arquivos `.env*` contêm credenciais e não devem ser versionados.

Para habilitar cadastro com confirmação de e-mail, configure localmente e na
Vercel as variáveis documentadas em `.env.example`: `APP_URL`,
`RESEND_API_KEY` e `EMAIL_FROM`. Em produção, `APP_URL` deve conter a URL HTTPS
da aplicação e `EMAIL_FROM` deve usar um domínio verificado no Resend.

## Deploy

Depois de publicar o repositório no GitHub, importe-o na [Vercel](https://vercel.com/new). A Vercel detectará o Next.js e preencherá as configurações de build automaticamente.
