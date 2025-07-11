export function detectarSubject(datoImportante) {
  const lower = datoImportante.toLowerCase();

  if (lower.includes("yo ") || lower.includes("me ") || lower.includes("mi ")) {
    return "usuario";
  }

  if (
    lower.includes("eres") ||
    lower.includes("tú ") ||
    lower.includes("vos ") ||
    lower.includes("sos ")
  ) {
    return "personaje";
  }

  // Detectar sujeto por mención
  const match = lower.match(/^([\w\s]+?):/); // ejemplo: "hermana: vive en Madrid"
  if (match && match[1]) {
    return match[1].trim();
  }

  return "usuario"; // por defecto
}