export function necesitaBusquedaWeb(texto) {
  const lower = texto.toLowerCase();
  const keywords = [
    "quién es", 
    "quién fue",
    "qué es", 
    "que es", 
    "qué fue",
    "cuándo", 
    "cuando",
    "dónde", 
    "donde",
    "por qué", 
    "por que", 
    "cómo", 
    "como",
    "últimas noticias", 
    "ultimas noticias", 
    "ganador", 
    "resultado", 
    "buscá", 
    "busca", 
    "buscar"
  ];
  return keywords.some((k) => lower.includes(k));
}
