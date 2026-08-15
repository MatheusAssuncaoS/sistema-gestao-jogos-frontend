import { api } from './api';

export interface DiaFuncionamento {
  id: string;
  diaDaSemana: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  horario: string;
}

export interface ExcecaoCalendario {
  id: string;
  descricao: string;
  tipo: 'FERIADO' | 'RECESSO' | 'BLOQUEIO';
  inicio: string;
  fim: string;
}

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
  listarDias: () => api.get<DiaFuncionamento[]>('/api/admin/calendario/dias-funcionamento'),
  criarDia: (diaDaSemana: DiaFuncionamento['diaDaSemana'], horario: string) => api.post<DiaFuncionamento>('/api/admin/calendario/dias-funcionamento', { diaDaSemana, horario }),
  editarDia: (id: string, diaDaSemana: DiaFuncionamento['diaDaSemana'], horario: string) => api.put<DiaFuncionamento>(`/api/admin/calendario/dias-funcionamento/${id}`, { diaDaSemana, horario }),
  excluirDia: (id: string) => api.delete<void>(`/api/admin/calendario/dias-funcionamento/${id}`),
  listarExcecoes: () => api.get<ExcecaoCalendario[]>('/api/admin/calendario/excecoes'),
  criarExcecao: (dados: Omit<ExcecaoCalendario, 'id'>) => api.post<ExcecaoCalendario>('/api/admin/calendario/excecoes', dados),
  editarExcecao: (id: string, dados: Omit<ExcecaoCalendario, 'id'>) => api.put<ExcecaoCalendario>(`/api/admin/calendario/excecoes/${id}`, dados),
  excluirExcecao: (id: string) => api.delete<void>(`/api/admin/calendario/excecoes/${id}`),
};
