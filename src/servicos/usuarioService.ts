import { api } from './api';
import type { Usuario } from './tipos';

export interface DadosPessoais {
  nome: string;
  email: string;
}

export const usuarioService = {
  atualizarMeusDados: (dados: DadosPessoais) =>
    api.put<Usuario>('/api/usuarios/eu', dados),
};
