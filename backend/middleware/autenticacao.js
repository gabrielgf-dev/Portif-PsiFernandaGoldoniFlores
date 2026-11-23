
const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      erro: "Acesso não autorizado."
    });
  }

  try {
    const usuario = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (usuario.tipo !== "admin") {
      return res.status(403).json({
        erro: "Permissão insuficiente."
      });
    }

    req.usuario = usuario;
    next();

  } catch {
    return res.status(401).json({
      erro: "Sessão inválida ou expirada."
    });
  }
}

module.exports = autenticar;
