import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, CalendarCheck, CalendarDays, ChevronRight, Clock3, MapPin, ShieldCheck, UsersRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../servicos/api';
import { jogadorPartidaService } from '../servicos/jogadorPartidaService';
import type { InscricaoDoJogador, Inscrito, StatusInscricao } from '../servicos/tipos';

const rotulosStatus: Record<StatusInscricao, string> = { CONFIRMADA: 'Confirmada', LISTA_ESPERA: 'Lista de espera', CANCELADA: 'Cancelada', PRESENTE: 'Presença confirmada', AUSENTE: 'Ausente' };
const data = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const diaDaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const diaEMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const mensagemDeErro = (falha: unknown) => falha instanceof ApiError ? falha.detail : 'Não foi possível completar a operação.';
const primeiraMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function MinhasInscricoesPage() {
  const [selecionada, setSelecionada] = useState<InscricaoDoJogador | null>(null);
  const queryClient = useQueryClient();
  const inscricoes = useQuery({ queryKey: ['inscricoes', 'minhas'], queryFn: jogadorPartidaService.listarMinhasInscricoes });
  const cancelamento = useMutation({ mutationFn: jogadorPartidaService.cancelarInscricao, onSuccess: async () => Promise.all([queryClient.invalidateQueries({ queryKey: ['inscricoes', 'minhas'] }), queryClient.invalidateQueries({ queryKey: ['partidas', 'disponiveis'] }), queryClient.invalidateQueries({ queryKey: ['partidas', 'participantes'] })]) });
  const inscricoesOrdenadas = inscricoes.data ? [...inscricoes.data].sort((primeira, segunda) => new Date(primeira.inicioDaPartida).getTime() - new Date(segunda.inicioDaPartida).getTime()) : [];
  function cancelar(inscricao: InscricaoDoJogador) { if (window.confirm(`Cancelar sua inscrição na partida de ${data.format(new Date(inscricao.inicioDaPartida))}?`)) cancelamento.mutate(inscricao.partidaId, { onSuccess: () => setSelecionada(null) }); }
  if (selecionada) return <DetalhesDaInscricao inscricao={selecionada} voltar={() => setSelecionada(null)} cancelar={() => cancelar(selecionada)} cancelando={cancelamento.isPending} />;
  return <div className="player-page">
    <div className="player-section-heading player-page-title"><div><span>Minha agenda</span><h1>Minhas inscrições</h1><p>Acompanhe suas próximas participações e o status de cada vaga.</p></div><CalendarCheck /></div>
    {cancelamento.isSuccess && <div role="status" className="player-feedback success">Inscrição cancelada.</div>}
    {cancelamento.isError && <div role="alert" className="player-feedback error">{mensagemDeErro(cancelamento.error)}</div>}
    {inscricoes.isPending && <div className="player-loading"><i /><i /></div>}
    {inscricoes.isError && <div className="player-empty"><CalendarDays /><h3>Não conseguimos carregar sua agenda</h3><p>{mensagemDeErro(inscricoes.error)}</p><button onClick={() => inscricoes.refetch()}>Tentar novamente</button></div>}
    {inscricoes.isSuccess && inscricoes.data.length === 0 && <div className="player-empty"><UsersRound /><h3>Sua agenda está livre</h3><p>Você ainda não possui inscrições ativas.</p><Link to="/partidas">Encontrar uma partida</Link></div>}
    {inscricoes.isSuccess && inscricoesOrdenadas.length > 0 && <ul className="player-registration-list">{inscricoesOrdenadas.map((inscricao) => <InscricaoCard key={inscricao.id} inscricao={inscricao} abrir={() => setSelecionada(inscricao)} />)}</ul>}
  </div>;
}

function InscricaoCard({ inscricao, abrir }: { inscricao: InscricaoDoJogador; abrir: () => void }) {
  const inicio = new Date(inscricao.inicioDaPartida);
  return <li className="player-registration-card"><button type="button" className="player-registration-summary" onClick={abrir} aria-label={`Ver detalhes da partida de ${data.format(inicio)}`}><div className="player-registration-accent"><CalendarCheck /></div><div className="player-registration-content">
    <div className="player-registration-heading"><div><span>Próxima partida</span><h2><strong>{primeiraMaiuscula(diaDaSemana.format(inicio))}</strong><small>{diaEMes.format(inicio)}</small></h2></div><div className="player-registration-status"><em className={`status-${inscricao.status.toLowerCase()}`}>{rotulosStatus[inscricao.status]}</em><div className="player-capacity-card"><span>Elenco</span><strong>{inscricao.quantidadeConfirmados}/{inscricao.capacidade}</strong><small>{Math.max(0, inscricao.capacidade - inscricao.quantidadeConfirmados)} {inscricao.capacidade - inscricao.quantidadeConfirmados === 1 ? 'vaga' : 'vagas'}</small></div></div></div>
    <div className="player-registration-details"><span><Clock3 />{hora.format(inicio)}</span><span><MapPin />{inscricao.local}</span>{inscricao.equipe && <span><ShieldCheck />Equipe {inscricao.equipe}</span>}</div>
    <span className="player-registration-open">Ver detalhes <ChevronRight /></span>
  </div></button></li>;
}

function DetalhesDaInscricao({ inscricao, voltar, cancelar, cancelando }: { inscricao: InscricaoDoJogador; voltar: () => void; cancelar: () => void; cancelando: boolean }) {
  const inicio = new Date(inscricao.inicioDaPartida);
  const participantes = useQuery({ queryKey: ['partidas', 'participantes', inscricao.partidaId], queryFn: () => jogadorPartidaService.listarParticipantes(inscricao.partidaId) });
  const confirmados = participantes.data?.filter((item) => item.status !== 'LISTA_ESPERA') ?? [];
  const espera = participantes.data?.filter((item) => item.status === 'LISTA_ESPERA') ?? [];
  return <div className="player-page player-registration-detail-page">
    <button type="button" className="player-detail-back" onClick={voltar}><ArrowLeft />Voltar para inscrições</button>
    <article className="player-registration-detail">
    <header><div><span>Detalhes da partida</span><h1><strong>{primeiraMaiuscula(diaDaSemana.format(inicio))}</strong><small>{diaEMes.format(inicio)}</small></h1></div><em className={`status-${inscricao.status.toLowerCase()}`}>{rotulosStatus[inscricao.status]}</em></header>
    <div className="player-registration-details"><span><Clock3 />{hora.format(inicio)}</span><span><MapPin />{inscricao.local}</span>{inscricao.equipe && <span><ShieldCheck />Equipe {inscricao.equipe}</span>}</div>
    <div className="player-roster"><ListaDePessoas titulo="Jogadores confirmados" pessoas={confirmados} carregando={participantes.isPending} /><ListaDePessoas titulo="Lista de espera" pessoas={espera} carregando={participantes.isPending} espera />{participantes.isError && <p role="alert" className="player-roster-error">Não foi possível carregar os participantes.</p>}</div>
    <button className="player-registration-cancel" type="button" onClick={cancelar} disabled={cancelando}><X />{cancelando ? 'Cancelando...' : 'Cancelar inscrição'}</button>
    </article>
  </div>;
}

function ListaDePessoas({ titulo, pessoas, carregando, espera = false }: { titulo: string; pessoas: Inscrito[]; carregando: boolean; espera?: boolean }) {
  return <section className={`player-roster-section${espera ? ' waiting' : ''}`}>
    <header><div><UsersRound /><h3>{titulo}</h3></div><span>{carregando ? '—' : pessoas.length}</span></header>
    {carregando && <p className="player-roster-empty">Carregando...</p>}
    {!carregando && pessoas.length === 0 && <p className="player-roster-empty">{espera ? 'Ninguém na fila de espera.' : 'Nenhum jogador confirmado.'}</p>}
    {!carregando && pessoas.length > 0 && <ol>{pessoas.map((pessoa, indice) => <li key={pessoa.inscricaoId}><span className="player-roster-position">{espera ? `${indice + 1}º` : <span className="player-roster-avatar">{pessoa.nome.trim().charAt(0).toUpperCase()}</span>}</span><div><strong>{pessoa.nome}</strong>{pessoa.categoria && <small>{pessoa.categoria}</small>}</div>{espera && <Clock3 />}</li>)}</ol>}
  </section>;
}
