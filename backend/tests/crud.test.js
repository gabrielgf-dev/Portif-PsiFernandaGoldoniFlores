const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Ambiente de teste: não usa dados reais
process.env.JWT_SECRET = "segredo-exclusivo-crud";
process.env.ADMIN_EMAIL = "teste@exemplo.com";
process.env.ADMIN_PASSWORD_HASH = "hash-de-teste";
process.env.DATABASE_URL = "postgresql://teste:teste@localhost:5432/testes";
process.env.SUPABASE_URL = "https://exemplo.supabase.co";
process.env.SUPABASE_SECRET_KEY = "chave-ficticia";

const app = require("../server");

let projetos;
let imagens;
let proximoId;

const token = jwt.sign({ tipo: "admin" }, process.env.JWT_SECRET, {
  expiresIn: "1h"
});

const autorizacao = `Bearer ${token}`;

// Simula as operações SQL usadas pelo servidor
app.locals.banco = {
  async query(sql, valores = []) {
    const comando = sql.replace(/\s+/g, " ").trim();

    if (comando.startsWith("SELECT * FROM projetos ORDER")) {
      return {
        rows: [...projetos.values()].sort((a, b) => b.id - a.id)
      };
    }

    if (comando.startsWith("SELECT * FROM projetos WHERE")) {
      const projeto = projetos.get(valores[0]);
      return { rows: projeto ? [{ ...projeto }] : [] };
    }

    if (comando.startsWith("INSERT INTO projetos")) {
      const projeto = {
        id: proximoId++,
        titulo: valores[0],
        descricao: valores[1],
        imagem: valores[2]
      };

      projetos.set(projeto.id, projeto);
      return { rows: [{ ...projeto }] };
    }

    if (comando.startsWith("UPDATE projetos")) {
      const projeto = projetos.get(valores[3]);
      if (!projeto) return { rows: [] };

      Object.assign(projeto, {
        titulo: valores[0],
        descricao: valores[1],
        imagem: valores[2]
      });

      return { rows: [{ ...projeto }] };
    }

    if (comando.startsWith("DELETE FROM projetos")) {
      const projeto = projetos.get(valores[0]);

      if (!projeto) return { rows: [] };

      projetos.delete(valores[0]);
      return { rows: [{ imagem: projeto.imagem }] };
    }

    throw new Error(`SQL não simulado: ${comando}`);
  }
};

// Simula o Supabase Storage
app.locals.supabase = {
  storage: {
    from(nomeBucket) {
      assert.equal(nomeBucket, "projetos-imagens");

      return {
        async upload(caminho, arquivo) {
          imagens.set(caminho, arquivo);
          return { error: null };
        },

        getPublicUrl(caminho) {
          return {
            data: {
              publicUrl:
                `${process.env.SUPABASE_URL}` +
                `/storage/v1/object/public/` +
                `${nomeBucket}/${caminho}`
            }
          };
        },

        async remove(caminhos) {
          for (const caminho of caminhos) {
            imagens.delete(caminho);
          }
          return { error: null };
        }
      };
    }
  }
};

// Cada teste começa com dados limpos
beforeEach(() => {
  projetos = new Map();
  imagens = new Map();
  proximoId = 1;
});

function criarProjeto(id = 1) {
  const projeto = {
    id,
    titulo: "Projeto original",
    descricao: "Descrição original",
    imagem: null
  };

  projetos.set(id, projeto);
  return projeto;
}

// 1. Consulta pública
test("Lista projetos cadastrados", async () => {
  criarProjeto();

  const resposta = await request(app).get("/projetos");

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.length, 1);
  assert.equal(resposta.body[0].titulo, "Projeto original");
});

// 2. Cadastro
test("Cadastra projeto com autorização", async () => {
  const resposta = await request(app)
    .post("/projetos")
    .set("Authorization", autorizacao)
    .send({
      titulo: "Projeto novo",
      descricao: "Descrição nova"
    });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.id, 1);
  assert.equal(projetos.size, 1);
  assert.equal(projetos.get(1).titulo, "Projeto novo");
});

// 3. Edição
test("Edita um projeto existente", async () => {
  criarProjeto();

  const resposta = await request(app)
    .put("/projetos/1")
    .set("Authorization", autorizacao)
    .send({
      titulo: "Título atualizado",
      descricao: "Descrição atualizada"
    });

  assert.equal(resposta.status, 200);
  assert.equal(projetos.get(1).titulo, "Título atualizado");
});

// 4. Exclusão
test("Exclui um projeto existente", async () => {
  criarProjeto();

  const resposta = await request(app)
    .delete("/projetos/1")
    .set("Authorization", autorizacao);

  assert.equal(resposta.status, 200);
  assert.equal(projetos.size, 0);
});

// 5. Cadastro com imagem
test("Envia imagem para o Storage simulado", async () => {
  const imagemJpg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

  const resposta = await request(app)
    .post("/projetos")
    .set("Authorization", autorizacao)
    .field("titulo", "Projeto com foto")
    .field("descricao", "Descrição da foto")
    .attach("imagem", imagemJpg, "foto.jpg");

  assert.equal(resposta.status, 201);
  assert.match(resposta.body.imagem, /exemplo\.supabase\.co/);
  assert.equal(imagens.size, 1);
});

// 6. Proteção de erro
test("Rejeita edição de projeto inexistente", async () => {
  const resposta = await request(app)
    .put("/projetos/999")
    .set("Authorization", autorizacao)
    .send({
      titulo: "Teste",
      descricao: "Teste"
    });

  assert.equal(resposta.status, 404);
});

// 7. Validação de identificador
test("Rejeita identificador inválido", async () => {
  const resposta = await request(app)
    .delete("/projetos/abc")
    .set("Authorization", autorizacao);

  assert.equal(resposta.status, 400);
});
