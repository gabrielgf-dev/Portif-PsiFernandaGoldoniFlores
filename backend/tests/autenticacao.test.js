const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Seha exclusiva para testes.
// Não utiliza as credenciais reais da Fernanda.
process.env.JWT_SECRET = "segredo-exclusivo-para-testes-automatizados";

const autenticar = require("../middleware/autenticacao");

// Criamos uma API pequena apenas para os testes.
const app = express();

app.use(express.json());

// Simula as três rotas protegidas.
// Nenhuma delas acessa o banco de dados.
app.post("/projetos", autenticar, (req, res) => {
  res.status(201).json({ sucesso: true });
});

app.put("/projetos/1", autenticar, (req, res) => {
  res.json({ sucesso: true });
});

app.delete("/projetos/1", autenticar, (req, res) => {
  res.json({ sucesso: true });
});

// TESTE 1: acesso sem login
test("Bloqueia acesso sem token", async () => {
  const resposta = await request(app)
    .post("/projetos")
    .send({ titulo: "Teste" });

  assert.ok(resposta.status >= 400 && resposta.status < 500);
});

// TESTE 2: token inválido
test("Bloqueia token inválido", async () => {
  const resposta = await request(app)
    .put("/projetos/1")
    .set("Authorization", "Bearer token-invalido");

  assert.ok(resposta.status >= 400 && resposta.status < 500);
});

// TESTE 3: token válido
test("Permite acesso com token válido", async () => {
  const token = jwt.sign({ tipo: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });

  const resposta = await request(app)
    .post("/projetos")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.sucesso, true);
});

// TESTE 4: token expirado
test("Bloqueia token expirado", async () => {
  const token = jwt.sign({ tipo: "admin" }, process.env.JWT_SECRET, {
    expiresIn: -1
  });

  const resposta = await request(app)
    .delete("/projetos/1")
    .set("Authorization", `Bearer ${token}`);

  assert.ok(resposta.status >= 400 && resposta.status < 500);
});

// TESTE 5: exclusão sem autorização
test("Impede exclusão sem login", async () => {
  const resposta = await request(app).delete("/projetos/1");

  assert.ok(resposta.status >= 400 && resposta.status < 500);
});
