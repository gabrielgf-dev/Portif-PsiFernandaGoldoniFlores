const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");

// Configurações fictícias exclusivas deste teste
process.env.JWT_SECRET = "chave-exclusiva-dos-testes";
process.env.ADMIN_EMAIL = "teste@exemplo.com";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("SenhaTeste123", 4);

// Endereços fictícios: não acessaremos o Supabase real
process.env.DATABASE_URL = "postgresql://teste:teste@localhost:5432/testes";

process.env.SUPABASE_URL = "https://exemplo.supabase.co";

process.env.SUPABASE_SECRET_KEY = "chave-ficticia-para-testes";

// Importa as rotas reais da aplicação
const app = require("../server");

// TESTE 1
test("Login correto retorna um token", async () => {
  const resposta = await request(app).post("/login").send({
    email: "teste@exemplo.com",
    senha: "SenhaTeste123"
  });

  assert.equal(resposta.status, 200);
  assert.equal(typeof resposta.body.token, "string");
});

// TESTE 2
test("Login rejeita senha incorreta", async () => {
  const resposta = await request(app).post("/login").send({
    email: "teste@exemplo.com",
    senha: "senha-errada"
  });

  assert.equal(resposta.status, 401);
});

// TESTE 3
test("Login rejeita email incorreto", async () => {
  const resposta = await request(app).post("/login").send({
    email: "outra@exemplo.com",
    senha: "SenhaTeste123"
  });

  assert.equal(resposta.status, 401);
});

// TESTE 4
test("Login exige email e senha", async () => {
  const resposta = await request(app).post("/login").send({});

  assert.equal(resposta.status, 400);
});

// TESTE 5
test("API real bloqueia cadastro sem token", async () => {
  const resposta = await request(app).post("/projetos").send({
    titulo: "Projeto teste",
    descricao: "Descrição teste"
  });

  assert.equal(resposta.status, 401);
});

// TESTE 6
test("Token válido permite chegar à validação do cadastro", async () => {
  const login = await request(app).post("/login").send({
    email: "teste@exemplo.com",
    senha: "SenhaTeste123"
  });

  assert.equal(login.status, 200);

  const resposta = await request(app)
    .post("/projetos")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({
      titulo: "",
      descricao: ""
    });

  // O token foi aceito, mas os campos são inválidos.
  // Assim, não há gravação no banco.
  assert.equal(resposta.status, 400);
  assert.equal(resposta.body.erro, "Título e descrição são obrigatórios.");
});
