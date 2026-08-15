import type { Usuario } from '../servicos/tipos';

/**
 * Decide se o usuário autenticado precisa ser redirecionado para a troca de
 * senha antes de acessar qualquer outra rota protegida.
 *
 * A rota /trocar-senha fica de fora da checagem: sem essa exceção, o próprio
 * redirecionamento criaria um laço (redireciona para /trocar-senha, que
 * redireciona para /trocar-senha, ...).
 */
export function devePedirTrocaDeSenha(usuario: Usuario | null, pathname: string): boolean {
  return !!usuario?.senhaProvisoria && pathname !== '/trocar-senha';
}
