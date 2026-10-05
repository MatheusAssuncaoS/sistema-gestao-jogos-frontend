import { api } from './api';

export type TipoSuspensao = 'DISCIPLINAR' | 'ADMINISTRATIVA' | 'OUTRA';

export interface SuspensaoJogador {
  id: string;
  jogadorId: string;
  usuarioId: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
  matriculaAssociado: string | null;
  tipo: TipoSuspensao;
  tipoId?: string;
  tipoNome?: string;
  motivo: string;
  inicio: string;
  fim: string | null;
  criadaEm: string;
  encerradaEm: string | null;
}

export type DadosSuspensao = Pick<SuspensaoJogador, 'jogadorId' | 'motivo' | 'inicio' | 'fim'> & { tipoId: string };

export interface TipoSuspensaoCadastro { id: string; nome: string; dias: number; ativo: boolean }
export type DadosTipoSuspensao = Omit<TipoSuspensaoCadastro, 'id'>;
const caminhoTipos = '/api/admin/configuracoes/tipos-suspensao';
export const tipoSuspensaoService = {
  listar: () => api.get<TipoSuspensaoCadastro[]>(caminhoTipos),
  criar: (dados: DadosTipoSuspensao) => api.post<TipoSuspensaoCadastro>(caminhoTipos, dados),
  editar: (id: string, dados: DadosTipoSuspensao) => api.put<TipoSuspensaoCadastro>(`${caminhoTipos}/${id}`, dados),
};

export const suspensaoService = {
  listar: () => api.get<SuspensaoJogador[]>('/api/admin/suspensoes'),
  registrar: (dados: DadosSuspensao) => api.post<SuspensaoJogador>('/api/admin/suspensoes', dados),
  encerrar: (id: string) => api.post<SuspensaoJogador>(`/api/admin/suspensoes/${id}/encerrar`),
};
