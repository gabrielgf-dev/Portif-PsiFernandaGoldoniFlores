function Home() {
  return (
    <section id="home" className="home">
      
      <div className="home-texto">
        <p className="subtitulo">Psicóloga Clínica</p>

        <h1>Fernanda</h1>
        <h2>Goldoni Flores</h2>
        <p>
          Um cuidado construído pela escuta.
        </p>

        <button>Agendar horário</button>
      </div>

      <div className="home-imagem">
        <img
          src="/Port-PsiFernandaGFlores/FerHome.webp"
          className="foto-home"
          alt="Fernanda"
        />
      </div>

    </section>
  )
}

export default Home