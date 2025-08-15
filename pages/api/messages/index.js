import { PrismaClient } from "@prisma/client";
import detectarSubject from "../funciones/detectarSubject";
import { buscarEnInternet } from "../funciones/buscarEnInternet";
import { necesitaBusquedaWeb } from "../funciones/necesitaBusquedaWeb";
import { buscarImagenesEnInternet } from "../funciones/buscarImagenesEnInternet";
import extraerYDecodificarURL from "../funciones/extraerYDecodificarURL";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    //console.log('Received GET request:')
    const characterId = parseInt(req.query.characterId);

    if (isNaN(characterId)) {
      return res
        .status(400)
        .json({ error: "Falta o es inválido el characterId en la query" });
    }

    const messages = await prisma.message.findMany({
      where: { characterId },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json(messages);
  } else if (req.method === "POST") {
    console.log("Received POST request:");
    const { sender, content, characterId } = req.body;

    if (!sender || !content || !characterId) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // 1. Guardar el mensaje del usuario
    const userMessage = await prisma.message.create({
      data: { sender, content, characterId },
    });

    if (sender === "Usuario") {
      try {
        // 2. Traer datos del personaje
        const character = await prisma.character.findUnique({
          where: { id: characterId },
        });

        if (!character) {
          return res.status(404).json({ error: "Personaje no encontrado" });
        }

        // Si el mensaje es un comando para recordar algo
        if (content.startsWith("/recordar ")) {
          const datoManual = content.replace("/recordar ", "").trim();

          await prisma.memoryEntry.create({
            data: {
              characterId,
              content: datoManual,
              topic: null, // o podés extraerlo con alguna lógica si querés clasificar
            },
          });

          // Actualizamos también el resumen acumulado del personaje
          await prisma.character.update({
            where: { id: characterId },
            data: {
              memory: (character.memory || "") + "\n" + datoManual,
            },
          });

          const confirmacion = await prisma.message.create({
            data: {
              sender: "bot",
              content: "👌 ¡Dato recordado!",
              characterId,
            },
          });

          return res.status(201).json([userMessage, confirmacion]);
        }

        const memoryEntries = await prisma.memoryEntry.findMany({
          where: { characterId },
          orderBy: { createdAt: "desc" },
          take: 10, // podés ajustar el número para no exceder límite de tokens
        });

        const memoriaDinamica = memoryEntries
          .map((entry) => entry.content)
          .reverse()
          .join("\n");

        let infoExtra = "";

        const necesitaImagen =
          content.toLowerCase().includes("imagen") ||
          content.toLowerCase().includes("foto") ||
          content.toLowerCase().includes("imagenes") ||
          content.toLowerCase().includes("fotos");

        let imagenesExtra = "";

        // Verificar si necesita buscar información en la web o imágenes
        if (necesitaBusquedaWeb(content)) {
          infoExtra = await buscarEnInternet(content);
        }

        console.log("Info extra encontrada:", necesitaImagen);
        if (necesitaImagen) {
          const imagenes = await buscarImagenesEnInternet(content);
          if (imagenes.length) {
            imagenesExtra = imagenes
              .slice(0, 3)
              .map((img, i) => {
                const cleanUrl = extraerYDecodificarURL(img.url);
                return `![Imagen ${i + 1}](${cleanUrl})`;
              })
              .join("\n");
          } else {
            imagenesExtra = "No se encontraron imágenes relevantes.";
          }
        }

        // if (necesitaBusquedaDeImagen(content)) {
        //   imagenesExtra = await buscarImagenesEnInternet(content);
        // }

        // En tu prompt, usar la memoria dinámica (o combinar con resumen previo)
        const prompt = `
          Eres un personaje con la siguiente personalidad: ${character.personality.join(
            ", "
          )}.

          Tu conocimiento previo sobre el usuario es:
          ${memoriaDinamica || character.memory || "Nada por ahora."}

          ${
            infoExtra
              ? `Información encontrada en la web:\n${infoExtra}\n\n`
              : `No encontraste resultados útiles en la web. Si no sabes la respuesta, dilo con sinceridad.`
          }

          ${
            imagenesExtra
              ? `Imágenes relevantes encontradas:\n${imagenesExtra}\n\n`
              : ""
          }

          El usuario dice: "${content}"

          Tu respuesta debe ser un JSON con dos campos:
          - "respuesta": lo que quieres responderle al usuario.
          - "datoImportante": si hay algo nuevo que deberías recordar sobre el usuario, escríbelo aquí. Si no, déjalo vacío.
          - Si hay imágenes en la información proporcionada, inclúyelas directamente como Markdown en tu respuesta (ej: ![texto](url)), sin cambiarlas a enlaces o texto plano.

          Responde SOLO el JSON, sin explicaciones.
        `.trim();

        // 3. Enviar el prompt al modelo
        const ollamaResponse = await fetch(
          "http://localhost:11434/api/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "mistral",
              stream: false,
              prompt,
            }),
          }
        );

        const raw = await ollamaResponse.text();
        let respuesta = "Lo siento, no entendí.";
        let datoImportante = "";

        try {
          const parsed = JSON.parse(raw);
          const secondParsed = JSON.parse(parsed.response); // segundo parse
          respuesta = secondParsed.respuesta;
          datoImportante = parsed.datoImportante;
        } catch (err) {
          console.error(
            "Error al parsear JSON de Ollama:",
            err,
            "\nRespuesta:",
            raw
          );
        }

        if (!respuesta || typeof respuesta !== "string") {
          console.error(
            "Respuesta inválida de Ollama (respuesta vacía o malformada):",
            raw
          );
          return res
            .status(500)
            .json({ error: "Respuesta inválida del modelo" });
        }

        // 4. Guardar respuesta del bot
        const botMessage = await prisma.message.create({
          data: {
            sender: "bot",
            content: respuesta,
            characterId,
          },
        });

        console.log("Respuesta del bot:", botMessage.content);

        // 5. Si hay un nuevo dato importante, actualizar al personaje
        if (datoImportante && datoImportante.trim()) {
          const cleanDato = datoImportante.trim();
          const subject = detectarSubject(cleanDato);

          await prisma.memoryEntry.create({
            data: {
              characterId,
              content: cleanDato,
              subject,
            },
          });

          if (subject === "personaje") {
            await prisma.character.update({
              where: { id: characterId },
              data: {
                memory: (character.memory || "") + "\n" + cleanDato,
              },
            });
          }
        }

        return res.status(201).json([userMessage, botMessage]);
      } catch (error) {
        console.error("Error al obtener respuesta de Ollama:", error);
        return res.status(500).json({ error: "Error al procesar el mensaje" });
      }
    }

    // Si no es "Usuario", devolver solo el mensaje guardado
    res.status(201).json(userMessage);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
