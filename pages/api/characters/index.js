import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Obtener todos los personajes
    const characters = await prisma.character.findMany({orderBy: { name: 'asc' }});
    return res.status(200).json(characters);
  }

  if (req.method === 'POST') {
    const { name, personality, memory } = req.body;
    console.log("POST body:", req.body);

    if (!name || !Array.isArray(personality) || personality.length === 0) {
      return res.status(400).json({ error: 'Faltan campos requeridos: name y personas[]' });
    }

    const newCharacter = await prisma.character.create({
      data: {
        name,
        personality,
        memory: memory || {},
      },
    });

    return res.status(201).json(newCharacter);
  }

  // Método no permitido
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Método ${req.method} no permitido`);
}
