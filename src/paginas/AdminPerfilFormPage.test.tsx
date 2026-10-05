import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { AdminPerfilFormPage } from './AdminPerfilFormPage';
import { AdminPerfisAcessoPage } from './AdminPerfisAcessoPage';
import type { PerfilAcesso, PermissaoAcesso } from '../servicos/perfilAcessoService';

vi.mock('../contexto/useAuth', () => ({ useAuth: () => ({ usuario: { papeis: ['ADMINISTRADOR'], permissoes: ['PERFIS_VISUALIZAR', 'PERFIS_GERENCIAR'] }, recarregarUsuario: vi.fn() }) }));
const perfil: PerfilAcesso = { id: 3, codigo: 'ADMINISTRADOR', nome: 'Administrador', descricao: 'Administração', sistema: true, ativo: true, versao: 0, usuarios: 2, permissoes: ['PERFIS_VISUALIZAR', 'PERFIS_GERENCIAR'] };
const perfilPersonalizado: PerfilAcesso = { id: 8, codigo: 'P_ATENDIMENTO', nome: 'Atendimento', descricao: 'Consulta e atendimento do clube', sistema: false, ativo: true, versao: 2, usuarios: 4, permissoes: ['PERFIS_VISUALIZAR'] };
const catalogo: PermissaoAcesso[] = [
  { codigo: 'PERFIS_VISUALIZAR', grupo: 'Perfis', nome: 'Consultar perfis', descricao: 'Consulta', dependencia: null, personalizavel: true },
  { codigo: 'PERFIS_GERENCIAR', grupo: 'Perfis', nome: 'Gerenciar perfis', descricao: 'Gestão', dependencia: 'PERFIS_VISUALIZAR', personalizavel: true },
];
function renderizar(rota: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['admin', 'perfis'], [perfil, perfilPersonalizado]);
  client.setQueryData(['admin', 'permissoes'], catalogo);
  try {
    return renderToString(<QueryClientProvider client={client}><MemoryRouter initialEntries={[rota]}><Routes>
      <Route path="/perfis" element={<AdminPerfisAcessoPage />} />
      <Route path="/perfis/novo" element={<AdminPerfilFormPage />} />
      <Route path="/perfis/:perfilId" element={<AdminPerfilFormPage />} />
    </Routes></MemoryRouter></QueryClientProvider>);
  } finally { client.clear(); }
}
it('oferece cadastro, filtros e detalhes a partir dos dados da API', () => {
  const html = renderizar('/perfis');
  expect(html).toContain('Cadastrar perfil');
  expect(html).toContain('Todos os status');
  expect(html).toContain('Administrador');
  expect(html).toContain('/admin/seguranca/perfis/3');
});
it('apresenta um perfil novo sem permissões pré-concedidas', () => {
  const html = renderizar('/perfis/novo');
  expect(html).toContain('Cadastrar perfil');
  expect(html).toContain('Permissões de acesso');
  expect(html).toContain('0<!-- --> <!-- -->selecionadas');
  expect(html).not.toContain('checked=""');
});
it('protege o padrão contra edição e permite usá-lo como modelo', () => {
  const html = renderizar('/perfis/3');
  expect(html).toContain('Perfil protegido do sistema');
  expect(html).toContain('Usar como modelo');
  expect(html).not.toContain('Salvar alterações');
});
it('abre perfil personalizado em modo de edição com os dados atuais', () => {
  const html = renderizar('/perfis/8');
  expect(html).toContain('Editar perfil');
  expect(html).toContain('Atendimento');
  expect(html).toContain('Consulta e atendimento do clube');
  expect(html).toContain('Salvar alterações');
  expect(html).not.toContain('Perfil protegido do sistema');
});
it('informa um ID inexistente sem abrir cadastro vazio', () => {
  expect(renderizar('/perfis/999')).toContain('Perfil não encontrado');
});
