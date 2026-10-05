import type { Usuario, UsuarioResumo } from '../servicos/tipos';
import type { PermissaoAcesso } from '../servicos/perfilAcessoService';

type Conta = Pick<Usuario, 'papeis' | 'permissoes'> | null | undefined;
export function pode(conta: Conta, permissao: string): boolean {
  return conta?.permissoes?.includes(permissao) ?? false;
}
export function acessoAdministrativo(conta: Conta): boolean {
  return conta?.permissoes?.some(p => !p.startsWith('ARBITRAGEM_') && !p.startsWith('INSCRICOES_')) ?? false;
}
export function funcionario(usuario: UsuarioResumo): boolean {
  return usuario.perfis?.some(p => p.codigo !== 'JOGADOR') ?? usuario.papeis.some(p => p !== 'JOGADOR');
}
export function nomesPerfis(usuario: UsuarioResumo): string[] {
  return usuario.perfis?.filter(p => p.codigo !== 'JOGADOR').map(p => p.nome) ?? usuario.papeis.filter(p => p !== 'JOGADOR');
}
export function alterarPermissao(selecionadas: string[], codigo: string, marcar: boolean, catalogo: PermissaoAcesso[]): string[] {
  const resultado = new Set(selecionadas);
  if (marcar) {
    resultado.add(codigo);
    const dependencia = catalogo.find(p => p.codigo === codigo)?.dependencia;
    if (dependencia) resultado.add(dependencia);
  } else {
    resultado.delete(codigo);
    catalogo.filter(p => p.dependencia === codigo).forEach(p => resultado.delete(p.codigo));
  }
  return [...resultado];
}
export function destinoInicial(conta: Conta): string {
  if (acessoAdministrativo(conta)) return '/admin';
  if (pode(conta, 'ARBITRAGEM_VISUALIZAR')) return '/arbitro';
  return '/partidas';
}
export function permissaoDaRota(caminho: string): string | undefined {
  if (caminho === '/admin/usuarios/novo') return 'SOLICITACOES_GERENCIAR';
  if (/^\/admin\/usuarios\/.+/.test(caminho)) return 'USUARIOS_GERENCIAR';
  if (caminho.includes('/seguranca/perfis/novo')) return 'PERFIS_GERENCIAR';
  if (caminho.includes('/seguranca/perfis')) return 'PERFIS_VISUALIZAR';
  if (caminho.includes('/seguranca/usuarios/novo')) return 'USUARIOS_GERENCIAR';
  if (caminho.includes('/seguranca/usuarios')) return 'USUARIOS_VISUALIZAR';
  if (caminho.includes('/cadastros')) return 'SOLICITACOES_VISUALIZAR';
  if (caminho.includes('/suspensoes/nova')) return 'USUARIOS_GERENCIAR';
  if (caminho.includes('/suspensoes')) return 'JOGADORES_VISUALIZAR';
  if (caminho.includes('/usuarios') || caminho.includes('/jogadores')) return 'JOGADORES_VISUALIZAR';
  if (caminho.includes('/partidas/nova')) return 'PARTIDAS_CRIAR';
  if (caminho.includes('/partidas')) return 'PARTIDAS_VISUALIZAR';
  if (caminho.includes('/configuracoes/calendario')) return caminho.endsWith('/novo') ? 'CALENDARIO_GERENCIAR' : 'CALENDARIO_VISUALIZAR';
  if (caminho.includes('/configuracoes')) return caminho.endsWith('/novo') ? 'CADASTROS_GERENCIAR' : 'CADASTROS_VISUALIZAR';
  return undefined;
}
