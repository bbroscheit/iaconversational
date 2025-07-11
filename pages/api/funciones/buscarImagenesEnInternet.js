export async function buscarImagenesEnInternet(query) {
  console.log("Buscando imágenes en internet para:", query);
  try {
    const apiKey = process.env.BRAVE_API_KEY;
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": apiKey,
        },
      }
    );

    const data = await res.json();
    const resultados = data.results || [];
    console.log("Resultados de búsqueda de imágenes:", res);
    // Filtrar solo URLs directas a imágenes que no pasen por proxys
    const imagenesValidas = resultados.filter((r) => {
      try {
        const url = new URL(r.url);
        const extensionValida = url.pathname.match(/\.(jpeg|jpg|png|gif|webp)$/i);
        const dominioValido = !url.hostname.includes("duckduckgo.com") &&
                              !url.hostname.includes("googleusercontent.com") &&
                              !url.hostname.includes("bing.net")&&
                              !url.hostname.includes("upload.wikimedia")&&
                              !url.hostname.includes("pbs.twimg")&&
                              !url.hostname.includes("example");
        return extensionValida && dominioValido;
      } catch {
        return false;
      }
    });
    console.log("Imágenes válidas encontradas:", imagenesValidas);
    return imagenesValidas.slice(0, 3).map((r) => `![${r.title}](${r.url})`).join("\n\n");
  } catch (error) {
    console.error("Error en búsqueda de imágenes:", error);
    return "No se pudo obtener imágenes.";
  }
}
