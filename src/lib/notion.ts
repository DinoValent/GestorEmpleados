// Este archivo se llamaba "notion.ts" porque la capa de datos original vivía
// en Notion. Desde la migración a Postgres, la implementación real está en
// "./db" — se mantiene este re-export para no tener que tocar los ~35
// archivos que ya importan desde "@/lib/notion" en toda la app.
export * from "./db";
