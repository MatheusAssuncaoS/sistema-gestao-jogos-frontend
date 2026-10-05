export function fimDoPeriodo(inicio: string, dias: number): string {
  if (!inicio) return '';
  const data = new Date(`${inicio}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias - 1);
  return data.toISOString().slice(0, 10);
}
