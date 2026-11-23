import { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao entrar.");
      }

      onLogin(dados.token);
      setSenha("");
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-admin">
      <h2>Área administrativa</h2>
      <p>Entre para gerenciar seus projetos.</p>

      <form onSubmit={entrar}>
        <label htmlFor="email-admin">E-mail</label>
        <input
          id="email-admin"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="senha-admin">Senha</label>
        <input
          id="senha-admin"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        {erro && <p role="alert">{erro}</p>}
      </form>
    </div>
  );
}

export default Login;
