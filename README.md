# Proyecto Chat con Memoria Dinámica

Este proyecto es una API para manejar un chatbot basado en personajes con memoria dinámica, que permite guardar y recordar datos importantes tanto del usuario como del personaje, y responder en base a esa memoria.

---

## Descripción

La API recibe mensajes del usuario y responde como un personaje ficticio con personalidad definida. Además, puede almacenar información importante que el usuario o el personaje quieran recordar, y utilizar esa memoria para enriquecer la conversación.

Se conecta con un modelo de lenguaje local (por ejemplo Ollama) para generar las respuestas y administrar la memoria.

---

## Características

- Gestión de mensajes entre usuario y personaje.
- Comando `/recordar` para almacenar datos importantes.
- Detección automática del sujeto del dato (usuario, personaje u otra persona).
- Uso de memoria dinámica para respuestas más personalizadas.
- Integración con modelo de lenguaje local vía API.
- Persistencia de datos con Prisma y base de datos (ej. PostgreSQL).
- Ordenamiento y recuperación histórica de mensajes.
- Actualización del resumen de memoria del personaje.

---

## Instalación y Uso

### Requisitos previos

- Node.js (v16 o superior recomendado)
- Base de datos utilizada - PostgreSQL
- Prisma CLI instalado globalmente o localmente (`npm install prisma --save-dev`)
- Servidor local del modelo de lenguaje (por ejemplo Ollama corriendo en `http://localhost:11434`)

### Pasos para instalar

1. Clonar el repositorio

   ```bash
   git clone https://github.com/tuUsuario/mi-proyecto-chat.git
   cd mi-proyecto-chat

