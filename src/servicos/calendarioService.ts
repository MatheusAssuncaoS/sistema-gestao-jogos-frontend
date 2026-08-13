import { api } from './api';

/**
 * Consulta do calendário do clube. Usada para montar o seletor de horário
 * na criação de partida: a maioria dos horários fora dessa lista cai em
 * dia/hora não configurado ou em feriado/recesso e o backend rejeitaria
 * com 409 (RN06/RN07) — melhor já oferecer só os horários válidos.
 */
export const calendarioService = {
  listarHorariosDisponiveis: (dias?: number) =>
    api.get<string[]>(
      `/api/calendario/horarios-disponiveis${dias !== undefined ? `?dias=${dias}` : ''}`
    ),
};
