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
