export async function buscarEnInternet(query) {
  console.log("Buscando en internet:", query);
  try {
    const apiKey = process.env.BRAVE_API_KEY;
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": apiKey,
        },
      }
    );

    const data = await res.json();
    const resultados = data.web?.results || [];

    return resultados.slice(0, 3).map((r) => `- ${r.title}: ${r.description}`).join("\n\n");
  } catch (error) {
    console.error("Error en búsqueda web:", error);
    return "No se pudo obtener información de internet.";
  }
}