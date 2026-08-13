/**
 * Regras de validação do formulário de cadastro.
 *
 * Ficam numa função pura, sem depender de React, para a tela só chamar e
 * exibir o resultado, e para a regra de senha poder ser reaproveitada pela
 * tela de recuperação de senha (UC "recuperação de senha").
 */

export const SENHA_TAMANHO_MINIMO = 8;
export const SENHA_TAMANHO_MAXIMO = 72;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): string | undefined {
  return REGEX_EMAIL.test(email) ? undefined : 'Informe um e-mail válido.';
}

export function validarSenha(senha: string): string | undefined {
  if (senha.length < SENHA_TAMANHO_MINIMO || senha.length > SENHA_TAMANHO_MAXIMO) {
    return `A senha deve ter entre ${SENHA_TAMANHO_MINIMO} e ${SENHA_TAMANHO_MAXIMO} caracteres.`;
  }
  return undefined;
}

export interface DadosFormularioCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
}

/**
 * Valida os campos do formulário de cadastro.
 *
 * Retorna um mapa de campo -> mensagem de erro; campos válidos não aparecem
 * no resultado. Um objeto vazio significa que o formulário pode ser enviado.
 */
export function validarCadastro(dados: DadosFormularioCadastro): Record<string, string> {
  const erros: Record<string, string> = {};

  if (!dados.nome.trim()) {
    erros.nome = 'Informe seu nome.';
  }

  const erroEmail = validarEmail(dados.email);
  if (erroEmail) {
    erros.email = erroEmail;
  }

  const erroSenha = validarSenha(dados.senha);
  if (erroSenha) {
    erros.senha = erroSenha;
  }

  if (dados.confirmacao !== dados.senha) {
    erros.confirmacao = 'A confirmação não confere com a senha.';
  }

  return erros;
}
