# Portfólio Profissional — Fernanda Goldoni Flores

Aplicação web desenvolvida para apresentar o trabalho profissional de Fernanda Goldoni Flores, com um portfólio público e um painel administrativo para gerenciamento de projetos.

O sistema permite atualizar os projetos exibidos no site por meio de uma interface administrativa, sem precisar modificar o código-fonte a cada atualização.

## Funcionalidades

**Área pública**
- Visualização dos projetos cadastrados.
- Exibição de imagens, títulos e descrições.
- Conteúdo atualizado a partir do banco de dados.

**Painel administrativo**
- Login protegido por autenticação JWT.
- Cadastro de novos projetos.
- Edição de títulos, descrições e imagens.
- Exclusão de projetos.
- Envio de imagens JPG, PNG e WebP, com limite de 5 MB.

## Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Front-end | React 19, Vite 8, JavaScript e CSS |
| Back-end | Node.js e Express 5 |
| Banco de dados | PostgreSQL (Supabase) |
| Armazenamento de imagens | Supabase Storage |
| Autenticação | JWT e bcryptjs |
| Upload de imagens | Multer |
| Testes automatizados | Node.js Test Runner e Supertest |
| Qualidade do código | ESLint |

## Estrutura do projeto

```text
Psi-FernandaGFlores/
├── src/
│   └── components/
├── backend/
│   ├── certs/
│   ├── database/
│   ├── middleware/
│   ├── tests/
│   └── server.js
├── public/
├── eslint.config.js
├── vite.config.js
├── package.json
└── README.md
```

A pasta `src` contém a interface React. O Back-end concentra as rotas da API, a autenticação e a comunicação com os serviços do Supabase.

## Pré-requisitos

- Node.js compatível com o projeto.
- npm.
- Projeto configurado no Supabase.
- Variáveis de ambiente necessárias para autenticação, banco de dados e armazenamento.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/gabrielgf-dev/Portif-PsiFernandaGoldoniFlores.git
cd Portif-PsiFernandaGoldoniFlores
```

Instale as dependências do Front-end:

```bash
npm install
```

Instale as dependências do Back-end:

```bash
cd backend
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `backend`, contendo:

```dotenv
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

A aplicação também utiliza um certificado de autoridade certificadora para verificar a conexão SSL com o PostgreSQL, armazenado em `backend/certs/supabase-ca.crt`.

**Segurança:** nunca publique senhas, chaves secretas, tokens administrativos ou o arquivo `.env` no GitHub.

## Execução local

Inicie o Back-end, dentro da pasta `backend`:

```bash
node server.js
```

Em outro terminal, na pasta principal, execute:

```bash
npm run dev
```

O Vite informará o endereço local do Front-end. A API Express utiliza a porta 3000 por padrão.

## Rotas principais da API

| Método | Rota | Acesso |
|---|---|---|
| GET | `/projetos` | Público |
| POST | `/login` | Público |
| POST | `/projetos` | Administrador |
| PUT | `/projetos/:id` | Administrador |
| DELETE | `/projetos/:id` | Administrador |

As operações administrativas exigem um token JWT válido.

## Testes automatizados

O projeto possui 18 testes automatizados, abrangendo:

- Autenticação e validação de tokens.
- Login com credenciais válidas e inválidas.
- Proteção de rotas administrativas.
- Cadastro, consulta, edição e exclusão de projetos.
- Upload de imagens com armazenamento simulado.
- Tratamento de identificadores inválidos e projetos inexistentes.

Execute os testes na pasta `backend`:

```bash
npm test
```

Os testes de CRUD utilizam simulações das dependências externas, sem modificar os dados reais armazenados no Supabase.

## Qualidade e build

Na pasta principal do projeto:

```bash
npm run lint
npm run build
```

O primeiro comando verifica o código com ESLint. O segundo gera a versão de produção do Front-end na pasta `dist`.

## Segurança

O sistema utiliza autenticação JWT para proteger as operações administrativas.

As senhas são verificadas utilizando bcryptjs, e as credenciais de serviços externos permanecem no ambiente do servidor.

Os arquivos enviados passam por verificação de formato e possuem limite de tamanho.

## Status do projeto

- [x] Interface React
- [x] API Express
- [x] Login administrativo
- [x] CRUD de projetos
- [x] PostgreSQL integrado
- [x] Supabase Storage integrado
- [x] Testes automatizados
- [x] Verificações de lint e build
- [ ] Publicação em produção
- [ ] Validação final do sistema publicado

## Desenvolvedor

**Gabriel Goldoni Flores**

GitHub: [gabrielgf-dev](https://github.com/gabrielgf-dev)

Projeto desenvolvido como aplicação Full Stack para uma necessidade real de gerenciamento de conteúdo profissional.