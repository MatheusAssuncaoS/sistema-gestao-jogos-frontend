import { describe, expect, it } from 'vitest';
import { alterarPermissao, acessoAdministrativo, destinoInicial, permissaoDaRota, pode } from './permissoes';
import type { PermissaoAcesso } from '../servicos/perfilAcessoService';
const catalogo: PermissaoAcesso[] = [
  { codigo: 'PARTIDAS_VISUALIZAR', nome: 'Consultar', grupo: 'Partidas', descricao: '', dependencia: null, personalizavel: true },
  { codigo: 'PARTIDAS_CRIAR', nome: 'Criar', grupo: 'Partidas', descricao: '', dependencia: 'PARTIDAS_VISUALIZAR', personalizavel: true },
  { codigo: 'PARTIDAS_CANCELAR', nome: 'Cancelar', grupo: 'Partidas', descricao: '', dependencia: 'PARTIDAS_VISUALIZAR', personalizavel: true },
];
describe('permissões de perfis', () => {
  it('inclui consulta ao conceder uma ação', () => {
    expect(alterarPermissao([], 'PARTIDAS_CRIAR', true, catalogo)).toEqual(['PARTIDAS_CRIAR', 'PARTIDAS_VISUALIZAR']);
  });
  it('remove ações dependentes ao remover consulta e preserva outras áreas', () => {
    expect(alterarPermissao(['PARTIDAS_VISUALIZAR', 'PARTIDAS_CRIAR', 'PARTIDAS_CANCELAR', 'USUARIOS_VISUALIZAR'], 'PARTIDAS_VISUALIZAR', false, catalogo)).toEqual(['USUARIOS_VISUALIZAR']);
  });
  it('não duplica dependências e mantém consulta ao remover uma ação', () => {
    expect(alterarPermissao(['PARTIDAS_VISUALIZAR'], 'PARTIDAS_VISUALIZAR', true, catalogo)).toHaveLength(1);
    expect(alterarPermissao(['PARTIDAS_VISUALIZAR', 'PARTIDAS_CRIAR'], 'PARTIDAS_CRIAR', false, catalogo)).toEqual(['PARTIDAS_VISUALIZAR']);
  });
  it('nega acessos ausentes, inclusive para um código de papel sem permissões atuais', () => {
    expect(pode({ papeis: ['ADMINISTRADOR'] }, 'USUARIOS_GERENCIAR')).toBe(false);
    expect(pode(null, 'PARTIDAS_CRIAR')).toBe(false);
  });
  it('encaminha perfis personalizados sem atribuir papel de administrador', () => {
    const usuario = { papeis: [], permissoes: ['CADASTROS_VISUALIZAR'] };
    expect(acessoAdministrativo(usuario)).toBe(true);
    expect(destinoInicial(usuario)).toBe('/admin');
    expect(pode(usuario, 'USUARIOS_VISUALIZAR')).toBe(false);
    expect(destinoInicial({ papeis: [], permissoes: ['ARBITRAGEM_VISUALIZAR'] })).toBe('/arbitro');
  });
  it('protege acesso direto às rotas de criação e consulta', () => {
    expect(permissaoDaRota('/admin/seguranca/perfis/novo')).toBe('PERFIS_GERENCIAR');
    expect(permissaoDaRota('/admin/seguranca/perfis/5')).toBe('PERFIS_VISUALIZAR');
    expect(permissaoDaRota('/admin/partidas/nova')).toBe('PARTIDAS_CRIAR');
    expect(permissaoDaRota('/admin/perfil')).toBeUndefined();
  });
});
