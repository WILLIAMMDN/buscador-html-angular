export const SAMPLE_HTML = `
<!doctype html>
<html lang="es">
  <head>
    <title>Guia de redes - muestra</title>
    <style>
      .question { border-left: 4px solid #146b5f; padding: 12px; background: #f5fbf9; }
      .hint { color: #5b6470; }
      .choice { margin: 4px 0; }
      .correct-answer { background: #dcfce7; color: #14532d; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>Repaso de redes</h1>
    <p class="question">1. Which OSI layer is responsible for logical addressing?</p>
    <ul>
      <li class="choice">Application</li>
      <li class="choice correct-answer">Network</li>
      <li class="choice">Transport</li>
    </ul>
    <p class="hint">La capa de red trabaja con direccionamiento logico y enrutamiento entre redes.</p>

    <p class="question">2. Que comando permite revisar la configuracion IP en Windows?</p>
    <ul>
      <li class="choice correct-answer">ipconfig</li>
      <li class="choice">show ip route</li>
      <li class="choice">ping -t</li>
    </ul>
    <p class="hint">Sirve para revisar direccion, mascara, puerta de enlace y DNS configurados.</p>

    <h2>Conceptos de seguridad</h2>
    <p class="question">3. What is the purpose of multifactor authentication?</p>
    <p class="hint">Respuesta correcta: It reduces account risk by requiring more than one proof of identity.</p>
  </body>
</html>
`;
