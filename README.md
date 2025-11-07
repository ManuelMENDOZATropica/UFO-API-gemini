# Oráculo Ricotero

Aplicación web creada con Next.js que permite conversar con el **Duende del Destino Ricotero**, un NPC que utiliza la API de Gemini para leer tu futuro rockero. Te evalúa según tu canción favorita de Patricio Rey y sus Redonditos de Ricota y te desafía con preguntas sobre letras, integrantes y fechas históricas.

## Requisitos

- Node.js 18 o superior (compatible con despliegues serverless en Vercel).
- Una clave de API de Gemini almacenada en la variable de entorno `GEMINI_API_KEY`.

## Instalación

```bash
npm install
```

> Nota: si la instalación falla por restricciones de red, vuelve a intentar en tu entorno local con acceso al registro de npm.

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
GEMINI_API_KEY="tu_clave_de_gemini"
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para interactuar con el oráculo ricotero.

## Despliegue en Vercel

1. Sube el repositorio a tu cuenta de GitHub.
2. Importa el proyecto en Vercel seleccionando el framework **Next.js**.
3. Define la variable de entorno `GEMINI_API_KEY` en la configuración del proyecto.
4. Despliega: Vercel generará funciones serverless para el endpoint `/api/fortune` automáticamente.

## Assets

Las ilustraciones del NPC y el fondo se encuentran en `public/assets/`.
