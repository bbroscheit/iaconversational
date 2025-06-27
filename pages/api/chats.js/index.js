import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    const userId = parseInt(req.query.userId); // suponiendo que guardás el ID de usuario
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Falta userId" });
    }

    // Traer todos los personajes con los que el usuario ha chateado
    const chats = await prisma.message.findMany({
      where: {
        sender: "Usuario",
      },
      select: {
        characterId: true,
      },
      distinct: ["characterId"],
    });

    // Opcional: traer info del personaje
    const characterIds = chats.map(c => c.characterId);
    const characters = await prisma.character.findMany({
      where: { id: { in: characterIds } },
    });

    res.status(200).json(characters);
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
