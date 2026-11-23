
const Database = require("better-sqlite3");
const path = require("node:path");

const caminhoBanco = path.join(__dirname, "fernanda.db");

const db = new Database(caminhoBanco);

db.exec(`
  CREATE TABLE IF NOT EXISTS projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    imagem TEXT
  )
`);

module.exports = db;
