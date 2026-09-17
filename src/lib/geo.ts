/** Utilidades de geolocalización compartidas entre cliente y servidor — sin
 * dependencias de Prisma/Next, así se puede importar tanto en componentes
 * "use client" como en src/lib/db.ts. */

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Se lanza cuando el empleado ficha fuera del radio permitido de su sucursal
 * (o sin ubicación, si la sucursal la exige). Se muestra tal cual al usuario. */
export class GeofenceError extends Error {
  status = 403;
}
