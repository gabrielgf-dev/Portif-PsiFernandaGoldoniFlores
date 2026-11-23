require("dotenv").config();

const { Client } = require("pg");
const Database = require("better-sqlite3");
const { createClient } = require("@supabase/supabase-js");

const fs = require("node:fs");
const path = require("node:path");

const obrigatorias = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];

for (const nome of obrigatorias) {
  if (!process.env[nome]) {
    throw new Error(`Falta configurar ${nome} no .env`);
  }
}

const sqlite = new Database(path.join(__dirname, "database", "fernanda.db"), {
  readonly: true,
  fileMustExist: true
});

const ca = fs.readFileSync(
  path.join(__dirname, "certs", "supabase-ca.crt"),
  "utf8"
);

// Preserva a verificação do certificado SSL
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
url.searchParams.delete("sslrootcert");

const postgres = new Client({
  connectionString: url.toString(),
  ssl: {
    ca,
    rejectUnauthorized: true
  }
});

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

const tipos = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

async function migrar() {
  const projetos = sqlite.prepare("SELECT * FROM projetos ORDER BY id").all();

  console.log(`${projetos.length} projetos encontrados.`);

  await postgres.connect();

  let concluidos = 0;

  for (const projeto of projetos) {
    let imagem = null;

    if (projeto.imagem) {
      const nome = path.basename(projeto.imagem);
      const caminho = path.join(__dirname, "uploads", nome);
      const tipo = tipos[path.extname(nome).toLowerCase()];

      if (!tipo || !fs.existsSync(caminho)) {
        console.log(`Imagem indisponível: projeto ${projeto.id}`);
        continue;
      }

      const arquivo = fs.readFileSync(caminho);
      const destino = `projetos/${projeto.id}/${nome}`;

      const { error } = await supabase.storage
        .from("projetos-imagens")
        .upload(destino, arquivo, {
          contentType: tipo,
          upsert: true
        });

      if (error) {
        console.log(
          `Falha no upload do projeto ${projeto.id}: ${error.message}`
        );
        continue;
      }

      const { data } = supabase.storage
        .from("projetos-imagens")
        .getPublicUrl(destino);

      imagem = data.publicUrl;
    }

    await postgres.query(
      `INSERT INTO projetos (id, titulo, descricao, imagem)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id)
       DO UPDATE SET
         titulo = EXCLUDED.titulo,
         descricao = EXCLUDED.descricao,
         imagem = EXCLUDED.imagem`,
      [projeto.id, projeto.titulo, projeto.descricao, imagem]
    );

    concluidos++;
    console.log(`Projeto ${projeto.id} transferido.`);
  }

  // Ajusta a sequência para futuros cadastros
  await postgres.query(`
    SELECT setval(
      pg_get_serial_sequence('public.projetos', 'id'),
      COALESCE((SELECT MAX(id) FROM public.projetos), 1),
      EXISTS(SELECT 1 FROM public.projetos)
    )
  `);

  console.log(
    `Migração concluída: ${concluidos} de ${projetos.length} projetos.`
  );
}

migrar()
  .catch((erro) => {
    console.error("Erro na migração:", erro.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgres.end().catch(() => {});
    sqlite.close();
  });
