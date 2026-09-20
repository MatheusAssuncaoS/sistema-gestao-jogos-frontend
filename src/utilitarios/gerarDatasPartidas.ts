import type { DiaDaSemana } from '../servicos/calendarioService';

const dias: DiaDaSemana[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function diasDaSemanaNoPeriodo(inicio: string, fim: string): DiaDaSemana[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) return [];
  const primeiro = Date.parse(`${inicio}T12:00:00Z`);
  const ultimo = Date.parse(`${fim}T12:00:00Z`);
  if (!Number.isFinite(primeiro) || !Number.isFinite(ultimo) || ultimo < primeiro) return [];
  if (new Date(primeiro).toISOString().slice(0, 10) !== inicio || new Date(ultimo).toISOString().slice(0, 10) !== fim) return [];
  const presentes = new Set<DiaDaSemana>();
  for (let instante = primeiro; instante <= ultimo && presentes.size < 7; instante += 86400000) {
    presentes.add(dias[new Date(instante).getUTCDay()]);
  }
  return [...dias.slice(1), dias[0]].filter(dia => presentes.has(dia));
}

/** Datas civis do clube; UTC é usado somente para avançar os dias sem depender do fuso do navegador. */
export function gerarDatasPartidas(inicio: string, fim: string, horario: string, selecionados: DiaDaSemana[], agora = Date.now()): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) return [];
  const primeiro = Date.parse(`${inicio}T12:00:00Z`);
  const ultimo = Date.parse(`${fim}T12:00:00Z`);
  if (!Number.isFinite(primeiro) || !Number.isFinite(ultimo) || ultimo < primeiro || ultimo - primeiro > 730 * 86400000) return [];
  const resultado: string[] = [];
  for (let instante = primeiro; instante <= ultimo; instante += 86400000) {
    const dia = new Date(instante);
    if (!selecionados.includes(dias[dia.getUTCDay()])) continue;
    const partida = `${dia.toISOString().slice(0, 10)}T${horario}:00-03:00`;
    if (Date.parse(partida) > agora) resultado.push(partida);
  }
  return resultado;
}

export type HorariosPorDia = Partial<Record<DiaDaSemana, string[]>>;

export function gerarDatasPorDia(inicio: string, fim: string, horarios: HorariosPorDia, agora = Date.now()): string[] {
  return [...new Set(Object.entries(horarios).flatMap(([dia, lista]) =>
    lista.flatMap(horario => gerarDatasPartidas(inicio, fim, horario, [dia as DiaDaSemana], agora))
  ))].sort();
}

export function conflitosNoLote(inicios: string[], duracaoMinutos: number): Set<string> {
  const ordenados = [...inicios].sort((a, b) => Date.parse(a) - Date.parse(b));
  const conflitos = new Set<string>();
  for (let i = 1; i < ordenados.length; i++) {
    if (Date.parse(ordenados[i]) < Date.parse(ordenados[i - 1]) + duracaoMinutos * 60000) {
      conflitos.add(ordenados[i - 1]);
      conflitos.add(ordenados[i]);
    }
  }
  return conflitos;
}
