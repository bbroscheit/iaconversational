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

    const urlsValidas = [];
    for (const r of resultados) {
      const url = r.url;
      if (
        url.match(/^https?:\/\/.+\.(jpeg|jpg|png|gif|webp)$/i) &&
        !url.includes("duckduckgo.com") &&
        !url.includes("googleusercontent.com") &&
        !url.includes("bing.net") &&
        !url.includes("example") &&
        !url.includes("wikimedia")
      ) {
        const esValida = await validarUrlImagen(url);
        if (esValida) urlsValidas.push({ title: r.title, url });
        if (urlsValidas.length >= 3) break;
      }
    }

    return urlsValidas; // Devolvemos un array de objetos {title, url}
  } catch (error) {
    console.error("Error en búsqueda de imágenes:", error);
    return [];
  }
}

