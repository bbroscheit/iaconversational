export function necesitaBusquedaDeImagen(texto) {
  console.log("necesitaBusquedaDeImagen:", texto);
  const lower = texto.toLowerCase();
  const keywords = [
    "imagen de", 
    "foto de", "mostrame una imagen", 
    "buscá una imagen", 
    "foto", 
    "imágenes",
    "buscar imagen",
    "buscar fotos",
    "imagenes",
    "fotos",
    
  ];
  return keywords.some((k) => lower.includes(k));
}
