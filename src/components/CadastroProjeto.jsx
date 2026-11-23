import { useEffect, useState } from "react";

function CadastroProjeto({ token, onSessaoExpirada }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarProjetos() {
    try {
      const resposta = await fetch("/projetos");

      if (!resposta.ok) {
        throw new Error("Erro ao consultar projetos.");
      }

      setProjetos(await resposta.json());
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  useEffect(() => {
    carregarProjetos();
  }, []);

  function limparFormulario() {
    setTitulo("");
    setDescricao("");
    setImagem(null);
    setEditandoId(null);
  }

  function iniciarEdicao(projeto) {
    setTitulo(projeto.titulo);
    setDescricao(projeto.descricao);
    setImagem(null);
    setEditandoId(projeto.id);
    setMensagem("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarProjeto(evento) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");

    const dados = new FormData();
    dados.append("titulo", titulo);
    dados.append("descricao", descricao);

    if (imagem) {
      dados.append("imagem", imagem);
    }

    const editando = editandoId !== null;

    const endereco = editando ? `/projetos/${editandoId}` : "/projetos";

    try {
      const resposta = await fetch(endereco, {
        method: editando ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: dados
      });

      if (resposta.status === 401) {
        onSessaoExpirada();
        return;
      }

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || "Erro ao salvar.");
      }

      setMensagem(
        editando
          ? "Projeto atualizado com sucesso!"
          : "Projeto cadastrado com sucesso!"
      );

      limparFormulario();
      evento.target.reset();
      await carregarProjetos();
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProjeto(id) {
    const confirmado = window.confirm("Deseja realmente excluir este projeto?");

    if (!confirmado) return;

    try {
      const resposta = await fetch(`/projetos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (resposta.status === 401) {
        onSessaoExpirada();
        return;
      }

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || "Erro ao excluir.");
      }

      if (editandoId === id) {
        limparFormulario();
      }

      setMensagem("Projeto excluído com sucesso!");
      await carregarProjetos();
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  return (
    <div>
      <h2>{editandoId !== null ? "Editar projeto" : "Cadastrar projeto"}</h2>

      <form onSubmit={salvarProjeto}>
        <label htmlFor="titulo-projeto">Título</label>
        <input
          id="titulo-projeto"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />

        <label htmlFor="descricao-projeto">Descrição</label>
        <textarea
          id="descricao-projeto"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <label htmlFor="imagem-projeto">
          {editandoId !== null
            ? "Substituir imagem (opcional)"
            : "Foto do projeto"}
        </label>

        <input
          id="imagem-projeto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImagem(e.target.files[0] || null)}
        />

        <button type="submit" disabled={salvando}>
          {salvando
            ? "Salvando..."
            : editandoId !== null
              ? "Salvar alterações"
              : "Cadastrar projeto"}
        </button>

        {editandoId !== null && (
          <button
            type="button"
            onClick={() => {
              limparFormulario();
              setMensagem("");
              document.getElementById("imagem-projeto").value = "";
            }}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <p role="status">{mensagem}</p>

      <h2>Projetos cadastrados</h2>

      {projetos.map((projeto) => (
        <article key={projeto.id} className="admin-projeto">
          <h3>{projeto.titulo}</h3>
          <p>{projeto.descricao}</p>

          {projeto.imagem && (
            <img
              src={projeto.imagem}
              alt={projeto.titulo}
              style={{ maxWidth: "200px", width: "100%" }}
            />
          )}

          <div>
            <button type="button" onClick={() => iniciarEdicao(projeto)}>
              Editar
            </button>

            <button type="button" onClick={() => excluirProjeto(projeto.id)}>
              Excluir
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default CadastroProjeto;
