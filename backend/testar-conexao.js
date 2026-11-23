
require("dotenv").config();

const { Client } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

const certificado = fs.readFileSync(
  path.join(__dirname, "certs", "supabase-ca.crt"),
  "utf8"
);

const banco = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  }
});

async function testarConexao() {
  try {
    await banco.connect();

    const resultado = await banco.query(
      "SELECT COUNT(*) AS total FROM projetos"
    );

    console.log("Conexão com Supabase realizada!");
    console.log("Projetos cadastrados:", resultado.rows[0].total);

  } catch (erro) {
    console.error("Erro de conexão:", erro.message);

  } finally {
    await banco.end().catch(() => {});
  }
}

testarConexao();
