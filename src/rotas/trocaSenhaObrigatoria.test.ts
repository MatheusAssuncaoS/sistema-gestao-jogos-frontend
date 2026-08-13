import { describe, expect, it } from 'vitest';

import type { Usuario } from '../servicos/tipos';
import { devePedirTrocaDeSenha } from './trocaSenhaObrigatoria';

function usuario(senhaProvisoria: boolean): Usuario {
  return {
    id: '1',
    nome: 'Maria Silva',
    email: 'maria@example.com',
    status: 'ATIVO',
    papeis: ['JOGADOR'],
    senhaProvisoria,
  };
}

describe('devePedirTrocaDeSenha', () => {
  it('não redireciona quando não há usuário autenticado', () => {
    expect(devePedirTrocaDeSenha(null, '/partidas')).toBe(false);
  });

  it('não redireciona quando o usuário não tem troca pendente', () => {
    expect(devePedirTrocaDeSenha(usuario(false), '/partidas')).toBe(false);
  });

  it('redireciona quando o usuário tem troca pendente e está em outra rota', () => {
    expect(devePedirTrocaDeSenha(usuario(true), '/partidas')).toBe(true);
  });

  it('não redireciona quando já está em /trocar-senha, para evitar laço', () => {
    expect(devePedirTrocaDeSenha(usuario(true), '/trocar-senha')).toBe(false);
  });
});
