import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { AdminEditarPartidaPage } from './AdminEditarPartidaPage';
import type { Partida } from '../servicos/tipos';

it.each(['RASCUNHO', 'ABERTA', 'CANCELADA', 'EXCLUIDA'] as const)('renderiza a partida %s e oferece as ações compatíveis', (status) => {
  const partida: Partida = {
    id: 'partida-nova', modalidade: 'Futebol', local: 'Campo', categoria: null,
    inicio: '2026-09-15T19:00:00-03:00', capacidade: 16, status,
    inscricoesAbremEm: null, inscricoesEncerramEm: null, escalaPublicada: false,
    versao: 0, equipes: [], duracaoMinutos: 60,
    arbitragem: { status: 'PREPARACAO', golsAmarelo: 0, golsAzul: 0, totalGols: 0,
      totalPunicoes: 0, cartoesAmarelos: 0, cartoesVermelhos: 0, expulsos: 0, acrescimos: 0, segundos: 0 },
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['partidas', 'gestao'], [partida]);
  client.setQueryData(['partidas', 'locais'], [{ id: 'campo', nome: 'Campo' }]);
  client.setQueryData(['partidas', 'categorias'], []);
  client.setQueryData(['partidas', partida.id, 'inscritos'], []);
  try {
    const html = renderToString(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin/partidas/partida-nova']}><Routes><Route path="/admin/partidas/:partidaId" element={<AdminEditarPartidaPage />} /></Routes></MemoryRouter></QueryClientProvider>);
    expect(html).toContain('Editar partida');
    expect(html).toContain('Resumo da partida');
    if (status === 'RASCUNHO' || status === 'ABERTA') expect(html).toContain('Cancelar Partida');
    expect(html).toContain('15/09/2026');
    expect(html.includes('Abrir inscrições')).toBe(status === 'RASCUNHO');
    expect(html.includes('Excluir partida')).toBe(status === 'RASCUNHO');
    expect(html.includes('Cancelar partida')).toBe(status === 'RASCUNHO' || status === 'ABERTA');
  } finally {
    client.clear();
  }
});

vi.mock('../contexto/useAuth', () => ({ useAuth: () => ({ usuario: { papeis: ['ADMINISTRADOR'], permissoes: ['PARTIDAS_VISUALIZAR', 'PARTIDAS_EDITAR', 'PARTIDAS_ABRIR', 'PARTIDAS_CANCELAR', 'PARTIDAS_EXCLUIR', 'PARTIDAS_INSCRITOS'] } }) }));
