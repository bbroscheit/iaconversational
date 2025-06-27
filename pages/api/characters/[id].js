import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { name, avatar, style, personality } = req.body;

    // Validación básica opcional
    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'El nombre debe ser una cadena de texto' });
    }
    if (avatar && typeof avatar !== 'string') {
      return res.status(400).json({ error: 'El avatar debe ser una URL o ruta válida' });
    }
    if (style && typeof style !== 'string') {
      return res.status(400).json({ error: 'El estilo debe ser una cadena de texto' });
    }
    if (personality && !Array.isArray(personality)) {
      return res.status(400).json({ error: 'La personalidad debe ser un arreglo de strings' });
    }

    try {
      const updatedCharacter = await prisma.character.update({
        where: { id: Number(id) },
        data: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar }),
          ...(style !== undefined && { style }),
          ...(personality !== undefined && { personality }),
        },
      });

      res.status(200).json(updatedCharacter);
    } catch (error) {
      console.error('Error actualizando personaje:', error);
      res.status(500).json({ error: 'No se pudo actualizar el personaje' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
