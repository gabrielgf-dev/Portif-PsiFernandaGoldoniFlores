
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const autenticar = require("./middleware/autenticacao");

// Verifica as configuraÃ§Ãµes necessÃ¡rias
const obrigatorias = [
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY"
];

for (const nome of obrigatorias) {
  if (!process.env[nome]) {
    throw new Error(`Falta ${nome} no arquivo .env`);
  }
}

const app = express();
app.use(express.json({ limit: "20kb" }));

// ConexÃ£o segura com PostgreSQL
const urlBanco = new URL(process.env.DATABASE_URL);

for (const parametro of [
  "sslmode",
  "sslrootcert",
  "sslcert",
  "sslkey"
]) {
  urlBanco.searchParams.delete(parametro);
}

const certificado = fs.readFileSync(
  path.join(__dirname, "certs", "supabase-ca.crt"),
  "utf8"
);

const banco = new Pool({
  connectionString: urlBanco.toString(),
  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  },
  max: 5,
  connectionTimeoutMillis: 10000
});

// ConexÃ£o com Supabase Storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
app.locals.banco = banco;
app.locals.supabase = supabase;
const bucket = "projetos-imagens";

// ConfiguraÃ§Ã£o das imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function extensaoImagem(buffer) {
  if (
    buffer.subarray(0, 3).equals(
      Buffer.from([0xff, 0xd8, 0xff])
    )
  ) return ".jpg";

  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) return ".png";

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return ".webp";

  return null;
}

function erroUsuario(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

async function salvarImagem(arquivo) {
  if (!arquivo) return null;

  const extensao = extensaoImagem(arquivo.buffer);

  if (!extensao) {
    throw erroUsuario(
      "Formato de imagem invÃ¡lido. Use JPG, PNG ou WebP."
    );
  }

  const caminho =
    `projetos/${crypto.randomUUID()}${extensao}`;

  const tipos = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
  };

  const { error } = await app.locals.supabase.storage
    .from(bucket)
    .upload(caminho, arquivo.buffer, {
      contentType: tipos[extensao],
      upsert: false
    });

  if (error) {
    throw new Error(
      `Erro ao enviar imagem: ${error.message}`
    );
  }

  const { data } = app.locals.supabase.storage
    .from(bucket)
    .getPublicUrl(caminho);

  return data.publicUrl;
}

function caminhoImagem(imagem) {
  if (typeof imagem !== "string") return null;

  const prefixo =
    `${process.env.SUPABASE_URL.replace(/\/$/, "")}` +
    `/storage/v1/object/public/${bucket}/`;

  if (!imagem.startsWith(prefixo)) return null;

  const caminho = imagem
    .slice(prefixo.length)
    .split("?")[0];

  if (!caminho || caminho.includes("..")) {
    return null;
  }

  return decodeURIComponent(caminho);
}

async function excluirImagem(imagem) {
  const caminho = caminhoImagem(imagem);

  if (!caminho) return;

  const { error } = await app.locals.supabase.storage
    .from(bucket)
    .remove([caminho]);

  if (error) {
    throw new Error(
      `Erro ao excluir imagem: ${error.message}`
    );
  }
}

// Permite tratar erros em operaÃ§Ãµes assÃ­ncronas
function executar(operacao) {
  return (req, res, next) =>
    Promise.resolve(operacao(req, res, next))
      .catch(next);
}

function idValido(valor) {
  const id = Number(valor);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function validarTexto(req, res) {
  const { titulo, descricao } = req.body || {};

  if (
    typeof titulo !== "string" ||
    !titulo.trim() ||
    typeof descricao !== "string" ||
    !descricao.trim()
  ) {
    res.status(400).json({
      erro: "Título e descrição são obrigatórios."
    });

    return null;
  }

  return {
    titulo: titulo.trim(),
    descricao: descricao.trim()
  };
}

// Rota principal
app.get("/", (req, res) => {
  res.send("API da Fernanda funcionando!");
});

// Login administrativo
app.post("/login", (req, res) => {
  const { email, senha } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof senha !== "string"
  ) {
    return res.status(400).json({
      erro: "Informe e-mail e senha."
    });
  }

  const emailCorreto =
    email.trim().toLowerCase() ===
    process.env.ADMIN_EMAIL.trim().toLowerCase();

  const senhaCorreta = bcrypt.compareSync(
    senha,
    process.env.ADMIN_PASSWORD_HASH
  );

  if (!emailCorreto || !senhaCorreta) {
    return res.status(401).json({
      erro: "Credenciais invÃ¡lidas."
    });
  }

  const token = jwt.sign(
    { tipo: "admin" },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h"
    }
  );

  res.json({ token });
});

// Listar projetos
app.get("/projetos", executar(async (req, res) => {
  const resultado = await app.locals.banco.query(
    "SELECT * FROM projetos ORDER BY id DESC"
  );

  res.json(resultado.rows);
}));

// Cadastrar projeto
app.post(
  "/projetos",
  autenticar,
  upload.single("imagem"),
  executar(async (req, res) => {
    const dados = validarTexto(req, res);

    if (!dados) return;

    let imagem = null;

    try {
      imagem = await salvarImagem(req.file);

      const resultado = await app.locals.banco.query(
        `INSERT INTO projetos
         (titulo, descricao, imagem)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          dados.titulo,
          dados.descricao,
          imagem
        ]
      );

      res.status(201).json(resultado.rows[0]);

    } catch (erro) {
      if (imagem) {
        await excluirImagem(imagem).catch(e =>
          console.error(
            "Falha na limpeza:",
            e.message
          )
        );
      }

      throw erro;
    }
  })
);

// Editar projeto
app.put(
  "/projetos/:id",
  autenticar,
  upload.single("imagem"),
  executar(async (req, res) => {
    const id = idValido(req.params.id);

    if (!id) {
      return res.status(400).json({
        erro: "Identificador invÃ¡lido."
      });
    }

    const dados = validarTexto(req, res);

    if (!dados) return;

    const existente = await app.locals.banco.query(
      "SELECT * FROM projetos WHERE id = $1",
      [id]
    );

    if (!existente.rows.length) {
      return res.status(404).json({
        erro: "Projeto nÃ£o encontrado."
      });
    }

    const imagemAnterior =
      existente.rows[0].imagem;

    let novaImagem = null;

    try {
      if (req.file) {
        novaImagem = await salvarImagem(req.file);
      }

      const imagem =
        novaImagem || imagemAnterior;

      const resultado = await app.locals.banco.query(
        `UPDATE projetos
         SET titulo = $1,
             descricao = $2,
             imagem = $3
         WHERE id = $4
         RETURNING *`,
        [
          dados.titulo,
          dados.descricao,
          imagem,
          id
        ]
      );

      if (!resultado.rows.length) {
        if (novaImagem) {
          await excluirImagem(novaImagem);
        }

        return res.status(404).json({
          erro: "Projeto nÃ£o encontrado."
        });
      }

      if (novaImagem && imagemAnterior) {
        excluirImagem(imagemAnterior)
          .catch(e =>
            console.error(
              "Falha ao remover imagem antiga:",
              e.message
            )
          );
      }

      res.json(resultado.rows[0]);

    } catch (erro) {
      if (novaImagem) {
        await excluirImagem(novaImagem)
          .catch(e =>
            console.error(
              "Falha na limpeza:",
              e.message
            )
          );
      }

      throw erro;
    }
  })
);

// Excluir projeto
app.delete(
  "/projetos/:id",
  autenticar,
  executar(async (req, res) => {
    const id = idValido(req.params.id);

    if (!id) {
      return res.status(400).json({
        erro: "Identificador invÃ¡lido."
      });
    }

    const resultado = await app.locals.banco.query(
      `DELETE FROM projetos
       WHERE id = $1
       RETURNING imagem`,
      [id]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        erro: "Projeto nÃ£o encontrado."
      });
    }

    const imagem = resultado.rows[0].imagem;

    if (imagem) {
      excluirImagem(imagem)
        .catch(e =>
          console.error(
            "Falha ao remover imagem:",
            e.message
          )
        );
    }

    res.json({
      mensagem: "Projeto excluÃ­do com sucesso!"
    });
  })
);

// Tratamento de erros
app.use((erro, req, res, next) => {
  if (erro instanceof multer.MulterError) {
    return res.status(400).json({
      erro: "Erro no envio da imagem. Limite de 5 MB."
    });
  }

  console.error("Erro na API:", erro);

  res.status(erro.status || 500).json({
    erro: erro.status === 400
      ? erro.message
      : "Erro interno do servidor."
  });
});

// Iniciar servidor apÃ³s verificar o banco
async function iniciar() {
  await app.locals.banco.query(
    "SELECT 1 FROM projetos LIMIT 1"
  );

  const porta =
    Number(process.env.PORT) || 3000;

  app.listen(porta, () => {
    console.log(
      `Servidor rodando na porta ${porta} (Supabase)`
    );
  });
}


if (require.main === module) {
  iniciar().catch(erro => {
    console.error(
      "NÃ£o foi possÃ­vel conectar ao Supabase:",
      erro.message
    );

    process.exit(1);
  });
}

module.exports = app;


