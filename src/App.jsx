import { useEffect, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import Home from "./components/Home";
import Sobre from "./components/Sobre";
import Atendimento from "./components/Atendimento";
import Contato from "./components/Contato";
import Projetos from "./components/Projetos";
import CadastroProjeto from "./components/CadastroProjeto";
import Login from "./components/Login";

function App() {
  const [token, setToken] = useState(null);

  const areaAdmin = window.location.pathname === "/admin";

  useEffect(() => {
    if (areaAdmin) return;

    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("mostrar", entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [areaAdmin]);

  if (areaAdmin) {
    return (
      <main style={{ maxWidth: 600, margin: "60px auto", padding: 24 }}>
        {!token ? (
          <Login onLogin={setToken} />
        ) : (
          <>
            <button onClick={() => setToken(null)}>Sair</button>

            <CadastroProjeto
              token={token}
              onSessaoExpirada={() => setToken(null)}
            />
          </>
        )}
      </main>
    );
  }

  return (
    <>
      <Header />
      <Home />
      <Sobre />
      <Atendimento />
      <Projetos />
      <Contato />
    </>
  );
}

export default App;
