import { ArrowRight, CalendarClock, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { adminJogadorService } from '../servicos/adminJogadorService';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';

const formatadorData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const formatadorDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });
const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const ATUALIZACAO_AUTOMATICA_MS = 60_000;

export function AdminHome() {
  const [agora, setAgora] = useState(Date.now());
  const atualizacaoAutomatica = { refetchInterval: ATUALIZACAO_AUTOMATICA_MS, refetchIntervalInBackground: false, refetchOnMount: 'always' as const, refetchOnWindowFocus: 'always' as const };
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar, ...atualizacaoAutomatica });
  const pendentes = useQuery({ queryKey: ['admin', 'jogadores', 'pendentes'], queryFn: adminJogadorService.listarPendentes, ...atualizacaoAutomatica });
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar, ...atualizacaoAutomatica });
  const ultimaAtualizacao = Math.max(usuarios.dataUpdatedAt, pendentes.dataUpdatedAt, partidas.dataUpdatedAt);
  const emSeteDias = agora + 7 * 24 * 60 * 60 * 1000;
  const bloqueados = (usuarios.data ?? []).filter((usuario) => usuario.status === 'BLOQUEADO');
  const proximas = (partidas.data ?? []).filter((partida) => {
    const inicio = new Date(partida.inicio).getTime();
    return inicio >= agora && inicio <= emSeteDias && partida.status !== 'CANCELADA';
  }).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const cadastrosAguardandoAprovacao = [...(pendentes.data ?? [])].sort((a, b) => new Date(a.cadastradoEm).getTime() - new Date(b.cadastradoEm).getTime()).slice(0, 4);

  useEffect(() => {
    const relogio = window.setInterval(() => setAgora(Date.now()), 1_000);
    return () => window.clearInterval(relogio);
  }, []);

  return (
    <div className="admin-overview">
      <header className="admin-card-header admin-overview-heading"><div><h1>Visão geral</h1><p>Veja o que precisa da sua atenção hoje.</p></div><div className="admin-overview-refresh"><small>{usuarios.isFetching || pendentes.isFetching || partidas.isFetching ? 'Atualizando dados…' : textoUltimaAtualizacao(ultimaAtualizacao, agora)}</small><button type="button" className="admin-button admin-button-secondary" disabled={usuarios.isFetching || pendentes.isFetching || partidas.isFetching} onClick={() => { void usuarios.refetch(); void pendentes.refetch(); void partidas.refetch(); }}>Atualizar</button></div></header>
      <section className="admin-overview-summary" aria-label="Resumo operacional">
        <Resumo titulo="Cadastros pendentes" valor={pendentes.data?.length} carregando={pendentes.isPending} contexto="Aguardando análise" rota="/admin/cadastros" acao="Analisar fila" icone={UserRoundCheck} />
        <Resumo titulo="Contas bloqueadas" valor={bloqueados.length} carregando={usuarios.isPending} contexto="Exigem acompanhamento" rota="/admin/usuarios" acao="Revisar usuários" icone={ShieldAlert} />
        <Resumo titulo="Partidas nos próximos 7 dias" valor={proximas.length} carregando={partidas.isPending} contexto={proximas[0] ? `Próxima: ${formatadorData.format(new Date(proximas[0].inicio))}` : 'Nenhuma agendada'} rota="/admin/partidas" acao="Ver partidas" icone={CalendarClock} />
      </section>

      <section className="admin-overview-grid">
        <article className="admin-overview-panel">
          <header><div><h2>Cadastros aguardando aprovação</h2><p>Solicitações mais antigas aparecem primeiro.</p></div><Link to="/admin/cadastros">Ver todos <ArrowRight /></Link></header>
          {pendentes.isPending && <Skeleton linhas={3} />}
          {pendentes.isError && <Erro texto="Não foi possível carregar os cadastros." aoTentar={() => void pendentes.refetch()} />}
          {pendentes.isSuccess && cadastrosAguardandoAprovacao.length === 0 && <Vazio titulo="Nenhum cadastro pendente" texto="Novas solicitações aparecerão aqui." />}
          {cadastrosAguardandoAprovacao.map((cadastro) => <Link to={`/admin/cadastros?usuario=${cadastro.usuarioId}`} className="admin-overview-row" key={cadastro.usuarioId}><span className="admin-overview-avatar">{iniciais(cadastro.nome)}</span><div><strong>{cadastro.nome}</strong><small>{cadastro.email} · {tempoRelativo(cadastro.cadastradoEm, agora)}</small></div><span className="admin-status admin-status-pendente">Aguardando</span><ArrowRight /></Link>)}
        </article>

        <div className="admin-overview-side">
          <article className="admin-overview-panel">
            <header><div><h2>Próximas partidas</h2><p>Agenda administrativa dos próximos sete dias.</p></div><Link to="/admin/partidas">Ver todas <ArrowRight /></Link></header>
            {partidas.isPending && <Skeleton linhas={3} />}
            {partidas.isError && <Erro texto="Não foi possível carregar as partidas." aoTentar={() => void partidas.refetch()} />}
            {partidas.isSuccess && proximas.length === 0 && <Vazio titulo="Nenhuma partida próxima" texto="A agenda dos próximos sete dias está livre." />}
            {proximas.slice(0, 4).map((partida) => <Link to="/admin/partidas" className="admin-overview-row admin-match-row" key={partida.id}><span className="admin-date-box"><small>{formatadorMes.format(new Date(partida.inicio)).replace('.', '')}</small><strong>{formatadorDia.format(new Date(partida.inicio))}</strong></span><div><strong>{partida.modalidade}</strong><small>{partida.local} · {formatadorData.format(new Date(partida.inicio))}</small></div><span className={`admin-badge admin-badge-${partida.status.toLowerCase()}`}>{partida.status}</span></Link>)}
          </article>
          {usuarios.isSuccess && bloqueados.length > 0 && <aside className="admin-attention"><ShieldAlert aria-hidden="true" /><div><strong>{bloqueados.length} {bloqueados.length === 1 ? 'conta bloqueada' : 'contas bloqueadas'}</strong><p>Revise se as restrições ainda devem permanecer.</p></div><Link to="/admin/usuarios">Revisar <ArrowRight /></Link></aside>}
        </div>
      </section>
    </div>
  );
}

function Resumo({ titulo, valor, carregando, contexto, rota, acao, icone: Icone }: { titulo: string; valor?: number; carregando: boolean; contexto: string; rota: string; acao: string; icone: typeof UserRoundCheck }) {
  return <article><div className="admin-summary-top"><span>{titulo}</span><i><Icone aria-hidden="true" /></i></div><strong className="admin-summary-value">{carregando ? '—' : valor ?? '—'}</strong><footer><small>{contexto}</small><Link to={rota}>{acao} <ArrowRight /></Link></footer></article>;
}

function Skeleton({ linhas }: { linhas: number }) {
  return <div className="admin-table-skeleton" aria-label="Carregando">{Array.from({ length: linhas }, (_, indice) => <span key={indice} />)}</div>;
}

function Erro({ texto, aoTentar }: { texto: string; aoTentar: () => void }) {
  return <div className="admin-inline-error" role="alert"><span>{texto}</span><button onClick={aoTentar}>Tentar novamente</button></div>;
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="admin-empty-state"><h3>{titulo}</h3><p>{texto}</p></div>;
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

function tempoRelativo(data: string, agora: number) {
  const diferenca = Math.max(0, agora - new Date(data).getTime());
  const dias = Math.floor(diferenca / (24 * 60 * 60 * 1000));
  if (dias > 0) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  const horas = Math.max(1, Math.floor(diferenca / (60 * 60 * 1000)));
  return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
}

function textoUltimaAtualizacao(ultimaAtualizacao: number, agora: number) {
  if (!ultimaAtualizacao) return 'Aguardando primeira atualização';
  const segundos = Math.max(0, Math.floor((agora - ultimaAtualizacao) / 1000));
  if (segundos < 10) return 'Última atualização: agora';
  if (segundos < 60) return `Última atualização: há ${segundos} segundos`;
  const minutos = Math.floor(segundos / 60);
  return `Última atualização: há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
}
