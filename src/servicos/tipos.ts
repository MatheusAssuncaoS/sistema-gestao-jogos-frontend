/**
 * Tipos que espelham as respostas da API de autenticação.
 *
 * O backend devolve os papéis como strings livres (JOGADOR, ORGANIZADOR,
 * ADMINISTRADOR); tipando aqui, o TypeScript avisa quando alguém tentar
 * comparar com uma string que não existe.
 */

export type Papel = 'JOGADOR' | 'ORGANIZADOR' | 'ADMINISTRADOR';

export type StatusUsuario = 'PENDENTE' | 'ATIVO' | 'BLOQUEADO' | 'INATIVO' | 'RECUSADO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: StatusUsuario;
  papeis: Papel[];
  senhaProvisoria: boolean;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  status: StatusUsuario;
  papeis: Papel[];
}

export type SituacaoAssociativa = 'PENDENTE' | 'REGULAR' | 'IRREGULAR';

export interface CadastroPendente {
  usuarioId: string;
  nome: string;
  email: string;
  cadastradoEm: string;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Jogador {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  matriculaAssociado: string | null;
  categoria: string | null;
  situacaoAssociativa: SituacaoAssociativa;
  aprovadoEm: string;
}

export type StatusPartida = 'RASCUNHO' | 'ABERTA' | 'LOTADA' | 'ENCERRADA' | 'FINALIZADA' | 'CANCELADA';

export interface Modalidade {
  id: string;
  nome: string;
}

export interface LocalPartida {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface Equipe {
  id: string;
  nome: string;
  cor: string;
  capacidade: number;
}

export interface Partida {
  id: string;
  modalidade: string;
  local: string;
  categoria: string | null;
  inicio: string;
  capacidade: number;
  status: StatusPartida;
  inscricoesAbremEm: string | null;
  inscricoesEncerramEm: string | null;
  escalaPublicada: boolean;
  versao: number;
  equipes: Equipe[];
}

export type StatusInscricao = 'CONFIRMADA' | 'LISTA_ESPERA' | 'CANCELADA' | 'PRESENTE' | 'AUSENTE';

export interface Inscrito {
  inscricaoId: string;
  jogadorId: string;
  nome: string;
  categoria: string | null;
  status: StatusInscricao;
  dataSolicitacao: string;
}

export interface InscricaoDoJogador {
  id: string;
  partidaId: string;
  inicioDaPartida: string;
  local: string;
  status: StatusInscricao;
  dataSolicitacao: string;
  dataConfirmacao: string | null;
  equipe: string | null;
}
