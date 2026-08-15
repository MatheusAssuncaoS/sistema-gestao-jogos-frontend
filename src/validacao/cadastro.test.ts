import { describe, expect, it } from 'vitest';

import {
  SENHA_TAMANHO_MAXIMO,
  SENHA_TAMANHO_MINIMO,
  validarCadastro,
  validarEmail,
  validarSenha,
} from './cadastro';

const DADOS_VALIDOS = {
  nome: 'Maria Silva',
  email: 'maria@example.com',
  senha: 'SenhaSegura123!',
  confirmacao: 'SenhaSegura123!',
};

describe('validarCadastro', () => {
  it('não retorna erros para dados válidos', () => {
    expect(validarCadastro(DADOS_VALIDOS)).toEqual({});
  });

  it('acusa nome vazio ou só com espaços', () => {
    expect(validarCadastro({ ...DADOS_VALIDOS, nome: '' }).nome).toBeDefined();
    expect(validarCadastro({ ...DADOS_VALIDOS, nome: '   ' }).nome).toBeDefined();
  });

  it('acusa e-mail com formato inválido', () => {
    expect(validarCadastro({ ...DADOS_VALIDOS, email: 'sem-arroba' }).email).toBeDefined();
  });

  it('acusa senha fora da faixa de 8 a 72 caracteres', () => {
    const curta = 'a'.repeat(SENHA_TAMANHO_MINIMO - 1);
    const longa = 'a'.repeat(SENHA_TAMANHO_MAXIMO + 1);

    expect(
      validarCadastro({ ...DADOS_VALIDOS, senha: curta, confirmacao: curta }).senha
    ).toBeDefined();
    expect(
      validarCadastro({ ...DADOS_VALIDOS, senha: longa, confirmacao: longa }).senha
    ).toBeDefined();
  });

  it('aceita senha nos limites de 8 e 72 caracteres', () => {
    const minima = 'Aa1!' + 'a'.repeat(SENHA_TAMANHO_MINIMO - 4);
    const maxima = 'Aa1!' + 'a'.repeat(SENHA_TAMANHO_MAXIMO - 4);

    expect(validarCadastro({ ...DADOS_VALIDOS, senha: minima, confirmacao: minima }).senha).toBeUndefined();
    expect(validarCadastro({ ...DADOS_VALIDOS, senha: maxima, confirmacao: maxima }).senha).toBeUndefined();
  });

  it('acusa confirmação diferente da senha', () => {
    expect(validarCadastro({ ...DADOS_VALIDOS, confirmacao: 'outraSenha123' }).confirmacao).toBeDefined();
  });

  it('retorna todos os erros de uma vez quando vários campos falham', () => {
    const erros = validarCadastro({ nome: '', email: 'invalido', senha: '123', confirmacao: '456' });

    expect(Object.keys(erros).sort()).toEqual(['confirmacao', 'email', 'nome', 'senha']);
  });
});

describe('validarEmail', () => {
  it('aceita formatos comuns de e-mail', () => {
    expect(validarEmail('pessoa@dominio.com')).toBeUndefined();
    expect(validarEmail('pessoa.nome@sub.dominio.com.br')).toBeUndefined();
  });

  it('rejeita e-mails sem @ ou sem domínio', () => {
    expect(validarEmail('pessoa.dominio.com')).toBeDefined();
    expect(validarEmail('pessoa@dominio')).toBeDefined();
    expect(validarEmail('')).toBeDefined();
  });
});

describe('validarSenha', () => {
  it('rejeita senha abaixo do mínimo', () => {
    expect(validarSenha('a'.repeat(SENHA_TAMANHO_MINIMO - 1))).toBeDefined();
  });

  it('rejeita senha acima do máximo', () => {
    expect(validarSenha('a'.repeat(SENHA_TAMANHO_MAXIMO + 1))).toBeDefined();
  });

  it('aceita senha dentro da faixa permitida', () => {
    expect(validarSenha('Aa1!' + 'a'.repeat(SENHA_TAMANHO_MINIMO - 4))).toBeUndefined();
    expect(validarSenha('Aa1!' + 'a'.repeat(SENHA_TAMANHO_MAXIMO - 4))).toBeUndefined();
  });

  it('exige maiúscula, minúscula, número e caractere especial', () => {
    expect(validarSenha('senha123!')).toBeDefined();
    expect(validarSenha('SENHA123!')).toBeDefined();
    expect(validarSenha('SenhaForte!')).toBeDefined();
    expect(validarSenha('Senha1234')).toBeDefined();
  });
});
