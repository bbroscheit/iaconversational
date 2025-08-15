export default function extraerYDecodificarURL(originalUrl) {
  try {
    const parsed = new URL(originalUrl);
    const urlParam = parsed.searchParams.get("u");
    if (urlParam) {
      return decodeURIComponent(urlParam);
    }
    return originalUrl; // si no tiene ?u=... es una URL normal
  } catch (e) {
    return originalUrl; // si falla algo, devolvé la original
  }
}