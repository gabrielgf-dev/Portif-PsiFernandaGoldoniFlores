import { useEffect, useState } from "react";
import "./Projetos.css";

function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProjetos() {
      try {
        const resposta = await fetch("/projetos");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os projetos.");
        }

        const dados = await resposta.json();
        setProjetos(dados);
      } catch (erro) {
        setErro(erro.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarProjetos();
  }, []);

  return (
    <section id="projetos" className="projetos">
      <h2>Projetos e Experiências</h2>

      <p className="projetos-introducao">
        Conheça projetos e experiências desenvolvidos ao longo da minha
        trajetória profissional.
      </p>

      {carregando && <p>Carregando projetos...</p>}

      {erro && <p role="alert">{erro}</p>}

      <div className="projetos-grid">
        {projetos.map((projeto) => (
          <article className="projeto-card" key={projeto.id}>
            <div className="projeto-imagem">
              {projeto.imagem ? (
                <img src={projeto.imagem} alt={projeto.titulo} />
              ) : (
                <span>Imagem do projeto</span>
              )}
            </div>

            <div className="projeto-conteudo">
              <h3>{projeto.titulo}</h3>
              <p>{projeto.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Projetos;
