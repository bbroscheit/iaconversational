import { PrismaClient } from "@prisma/client";

// Función auxiliar para detectar el sujeto de un dato importante
function detectarSubject(datoImportante) {
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

  // Detectar sujeto por mención (ejemplo: "hermana: vive en Madrid")
  const match = lower.match(/^([\w\s]+?):/);
  if (match && match[1]) {
    return match[1].trim();
  }

  return "usuario"; // por defecto
}

const prisma = new PrismaClient();

export default async function handler(req, res) {
  //console.log("Received request:", req.method, req.body);
  if (req.method === "GET") {
    // Maneja las solicitudes GET para obtener mensajes
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
    // Maneja las solicitudes POST para enviar y procesar mensajes
    console.log("Received POST request:");
    const { sender, content, characterId } = req.body;

    if (!sender || !content || !characterId) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // 1. Guardar el mensaje del usuario en la base de datos
    const userMessage = await prisma.message.create({
      data: { sender, content, characterId },
    });

    // Solo procesar con el modelo si el mensaje es del "Usuario"
    if (sender === "Usuario") {
      try {
        // 2. Traer datos del personaje desde la base de datos
        const character = await prisma.character.findUnique({
          where: { id: characterId },
        });

        if (!character) {
          return res.status(404).json({ error: "Personaje no encontrado" });
        }

        // Si el mensaje es un comando para recordar algo
        if (content.startsWith("/recordar ")) {
          const datoManual = content.replace("/recordar ", "").trim();

          // Guardar el dato en la memoria del personaje
          await prisma.memoryEntry.create({
            data: {
              characterId,
              content: datoManual,
              topic: null, // Puedes añadir lógica para clasificar el tema si es necesario
            },
          });

          // Actualizar el resumen acumulado del personaje con el nuevo dato
          await prisma.character.update({
            where: { id: characterId },
            data: {
              memory: (character.memory || "") + "\n" + datoManual,
            },
          });

          // Crear un mensaje de confirmación del bot
          const confirmacion = await prisma.message.create({
            data: {
              sender: "bot",
              content: "👌 ¡Dato recordado!",
              characterId,
            },
          });

          return res.status(201).json([userMessage, confirmacion]);
        }

        // Obtener entradas de memoria dinámicas para el contexto del modelo
        const memoryEntries = await prisma.memoryEntry.findMany({
          where: { characterId },
          orderBy: { createdAt: "desc" },
          take: 10, // Limitar el número de entradas para no exceder el límite de tokens
        });

        const memoriaDinamica = memoryEntries
          .map((entry) => entry.content)
          .reverse() // Revertir para que los más antiguos estén primero
          .join("\n");

        // Construir el historial de chat para Gemini
        // El primer mensaje de usuario establece el contexto del personaje y la memoria
        const chatHistory = [
          {
            role: "user",
            parts: [
              {
                text: `Eres un personaje con la siguiente personalidad: ${character.personality.join(
                  ", "
                )}.`,
              },
              {
                text: `Tu conocimiento previo sobre el usuario es: ${
                  memoriaDinamica || character.memory || "Nada por ahora."
                }`,
              },
              { text: `El usuario dice: "${content}"` },
            ],
          },
        ];

        // Configuración para que Gemini devuelva un JSON estructurado
        const generationConfig = {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              respuesta: { type: "STRING" },
              datoImportante: { type: "STRING" },
            },
            required: ["respuesta"], // 'respuesta' es un campo obligatorio
          },
        };

        // La clave API se inyecta automáticamente en el entorno de Canvas si se deja vacía.
        const APIKEY = process.env.APIKEY || "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${APIKEY}`;
        //console.log("API URL:", APIKEY);
        // 3. Enviar la solicitud al modelo Gemini
        const geminiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: chatHistory,
            generationConfig: generationConfig,
          }),
        });

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json();
          console.error("Error de la API de Gemini:", errorData);
          return res
            .status(geminiResponse.status)
            .json({ error: "Error al comunicarse con el modelo Gemini", details: errorData });
        }

        const result = await geminiResponse.json();
        let respuesta = "Lo siento, no entendí.";
        let datoImportante = "";

        // Parsear la respuesta de Gemini
        if (
          result.candidates &&
          result.candidates.length > 0 &&
          result.candidates[0].content &&
          result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0
        ) {
          try {
            const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
            respuesta = parsedJson.respuesta || respuesta;
            datoImportante = parsedJson.datoImportante || "";
          } catch (parseError) {
            console.error("Error al parsear el JSON de Gemini:", parseError, "\nRaw response:", result.candidates[0].content.parts[0].text);
          }
        } else {
          console.error("Estructura de respuesta inesperada de Gemini:", result);
        }

        if (!respuesta || typeof respuesta !== "string") {
          console.error(
            "Respuesta inválida de Gemini (respuesta vacía o malformada):",
            result
          );
          return res
            .status(500)
            .json({ error: "Respuesta inválida del modelo Gemini" });
        }

        // 4. Guardar la respuesta del bot en la base de datos
        const botMessage = await prisma.message.create({
          data: {
            sender: "bot",
            content: respuesta,
            characterId,
          },
        });

        // 5. Si hay un nuevo dato importante, actualizar la memoria del personaje
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

          // Si el dato importante es sobre el personaje, actualizar su memoria acumulada
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
        console.error("Error al obtener respuesta de Gemini:", error);
        return res.status(500).json({ error: "Error al procesar el mensaje" });
      }
    }

    // Si el remitente no es "Usuario", solo devolver el mensaje guardado
    res.status(201).json(userMessage);
  } else {
    // Manejar métodos HTTP no permitidos
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
