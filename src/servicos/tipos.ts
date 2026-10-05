/**
 * Tipos que espelham as respostas da API de autenticação.
 *
 * O backend devolve os papéis como strings livres (JOGADOR, ORGANIZADOR,
 * ADMINISTRADOR); tipando aqui, o TypeScript avisa quando alguém tentar
 * comparar com uma string que não existe.
 */

export type Papel = 'JOGADOR' | 'ORGANIZADOR' | 'ARBITRO' | 'ADMINISTRADOR';

export type StatusUsuario = 'PENDENTE' | 'ATIVO' | 'BLOQUEADO' | 'INATIVO' | 'RECUSADO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: StatusUsuario;
  papeis: Papel[];
  permissoes?: string[];
  perfis?: import('./perfilAcessoService').PerfilAcesso[];
  senhaProvisoria: boolean;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  status: StatusUsuario;
  papeis: Papel[];
  permissoes?: string[];
  perfis?: import('./perfilAcessoService').PerfilAcesso[];
  versao: number;
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
  peso: number;
}

export interface Jogador {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  matriculaAssociado: string | null;
  categoria: string | null;
  situacaoAssociativa: SituacaoAssociativa;
  aprovadoEm: string;
}

export type StatusPartida = 'RASCUNHO' | 'ABERTA' | 'LOTADA' | 'ENCERRADA' | 'FINALIZADA' | 'CANCELADA' | 'EXCLUIDA';

export interface Modalidade {
  ativo?: boolean;
  id: string;
  nome: string;
}

export interface LocalPartida {
  ativo?: boolean;
  modalidadeIds?: string[];
  id: string;
  nome: string;
  descricao: string | null;
}

export interface Equipe {
  id: string;
  nome: string;
  cor: string;
  corHex: string;
  capacidade: number;
}

export interface Partida {
  modalidadeId?: string;
  duracaoMinutos: number;
  id: string;
  modalidade: string;
  local: string;
  categoria: string | null;
  inicio: string;
  capacidade: number;
  quantidadeInscritos?: number;
  status: StatusPartida;
  inscricoesAbremEm: string | null;
  inscricoesEncerramEm: string | null;
  escalaPublicada: boolean;
  versao: number;
  equipes: Equipe[];
  arbitragem: ResumoArbitragem;
}

export type StatusArbitragem = 'PREPARACAO' | 'EM_ANDAMENTO' | 'PAUSADA' | 'FINALIZADA';

export interface ResumoArbitragem {
  status: StatusArbitragem;
  golsAmarelo: number;
  golsAzul: number;
  totalGols: number;
  totalPunicoes: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  expulsos: number;
  acrescimos: number;
  segundos: number;
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
  capacidade: number;
  quantidadeConfirmados: number;
}
