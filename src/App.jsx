import { useEffect } from "react"
import "./App.css"

import Header from "./components/Header"
import Home from "./components/Home"
import Sobre from "./components/Sobre"
import Atendimento from "./components/Atendimento"
import Contato from "./components/Contato"

function App() {
  useEffect(() => {
    const sections = document.querySelectorAll("section")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("mostrar", entry.isIntersecting)
        })
      },
      {
        threshold: 0.25,
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Header />
      <Home />
      <Sobre />
      <Atendimento />
      <Contato />
    </>
  )
}

export default App