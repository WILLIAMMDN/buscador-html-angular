# HTML Study Lab

Aplicacion Angular para convertir paginas HTML guardadas en una biblioteca local de estudio.

El proyecto nace como una version mejorada de un `index.html` simple: ahora separa parsing, busqueda, estado, componentes visuales y persistencia local.

## Funciones

- Importacion de multiples archivos `.html` / `.htm`.
- Agrupacion de bloques por preguntas numeradas, encabezados y contenido relevante.
- Limpieza de scripts/eventos antes de previsualizar contenido.
- Vista aislada en `iframe sandbox` para conservar estilos sin mezclar el HTML externo con la app.
- Busqueda con normalizacion de acentos, scoring, filtros por fuente, tipo y estado.
- Panel de resultados, lector, palabras clave, opciones detectadas y apuntes propios.
- Modo practica con tarjetas pendientes/aprendidas.
- Analitica basica de documentos, progreso y temas frecuentes.
- Importacion/exportacion de biblioteca en JSON.
- Persistencia automatica en `localStorage`.

## Alcance

La app esta pensada como organizador y buscador local de material de estudio. No lee pantallas externas, no automatiza plataformas y no responde examenes por el usuario.

## Ejecutar

```bash
npm install
npm start
```

Luego abre `http://localhost:4200/`.

## Build

```bash
npm run build
```

## Tests

```bash
npm test -- --watch=false
```
