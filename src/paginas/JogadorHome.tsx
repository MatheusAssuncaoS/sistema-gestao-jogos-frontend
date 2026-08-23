import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, MapPin, RefreshCw, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexto/useAuth';
import { ApiError } from '../servicos/api';
import { jogadorPartidaService } from '../servicos/jogadorPartidaService';
import type { Partida, StatusInscricao } from '../servicos/tipos';

const dataCurta = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const mensagemDeErro = (falha: unknown) => falha instanceof ApiError ? falha.detail : 'Não foi possível completar a operação. Tente novamente.';

export function JogadorHome() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const aguardandoAprovacao = !usuario?.papeis.includes('JOGADOR') || usuario.status === 'PENDENTE';
  const partidas = useQuery({ queryKey: ['partidas', 'disponiveis'], queryFn: jogadorPartidaService.listarDisponiveis, enabled: !aguardandoAprovacao && usuario?.status !== 'RECUSADO' });
  const minhasInscricoes = useQuery({ queryKey: ['inscricoes', 'minhas'], queryFn: jogadorPartidaService.listarMinhasInscricoes, enabled: !aguardandoAprovacao && usuario?.status !== 'RECUSADO' });
  const inscricao = useMutation({
    mutationFn: jogadorPartidaService.inscrever,
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['partidas', 'disponiveis'] }),
      queryClient.invalidateQueries({ queryKey: ['inscricoes', 'minhas'] }),
    ]),
  });

  if (usuario?.status === 'RECUSADO') return <AvisoDeConta recusada />;
  if (aguardandoAprovacao) return <AvisoDeConta />;
  const horaAtual = new Date().getHours();
  const saudacao = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';
  return <div className="player-page">
    <section className="player-hero player-greeting"><h1>{saudacao}, {usuario?.nome.split(' ')[0]}</h1><CalendarDays aria-hidden="true" /></section>
    <div className="player-section-heading">
      <div><span>Partidas</span><h2>Disponíveis para você</h2><p>Inscrições abertas e organizadas por data.</p></div>
      <button type="button" onClick={() => Promise.all([partidas.refetch(), minhasInscricoes.refetch()])} disabled={partidas.isFetching || minhasInscricoes.isFetching}><RefreshCw size={18} /> Atualizar</button>
    </div>
    {inscricao.isSuccess && <div role="status" className={`player-feedback ${inscricao.data.status === 'LISTA_ESPERA' ? 'warning' : 'success'}`}>{inscricao.data.status === 'LISTA_ESPERA' ? 'Você entrou na lista de espera.' : 'Inscrição confirmada.'} Acompanhe os detalhes em <Link to="/minhas-inscricoes">Minhas inscrições</Link>.</div>}
    {inscricao.isError && <div role="alert" className="player-feedback error">{mensagemDeErro(inscricao.error)}</div>}
    {partidas.isPending && <Carregando />}
    {partidas.isError && <EstadoErro mensagem={mensagemDeErro(partidas.error)} tentar={() => partidas.refetch()} />}
    {partidas.isSuccess && partidas.data.length === 0 && <EstadoVazio />}
    {partidas.isSuccess && partidas.data.length > 0 && <ul className="player-match-list">{partidas.data.map((partida, indice) => {
      const inscricaoExistente = minhasInscricoes.data?.find((item) => item.partidaId === partida.id && item.status !== 'CANCELADA');
      return <PartidaCard key={partida.id} partida={partida} destaque={indice === 0} statusInscricao={inscricaoExistente?.status} enviando={inscricao.isPending && inscricao.variables === partida.id} bloqueado={inscricao.isPending || minhasInscricoes.isPending} aoInscrever={() => inscricao.mutate(partida.id)} />;
    })}</ul>}
  </div>;
}

function PartidaCard({ partida, destaque, statusInscricao, enviando, bloqueado, aoInscrever }: { partida: Partida; destaque: boolean; statusInscricao?: StatusInscricao; enviando: boolean; bloqueado: boolean; aoInscrever: () => void }) {
  const inicio = new Date(partida.inicio);
  const lotada = partida.status === 'LOTADA';
  // Durante uma atualização gradual, uma API antiga pode ainda não enviar a
  // contagem. Nesse intervalo, ao menos a inscrição do próprio jogador é
  // conhecida; a API atualizada substitui este fallback pelo total real.
  const quantidadeInscritos = partida.quantidadeInscritos ?? (statusInscricao ? 1 : 0);
  return <li className={`player-match-card${destaque ? ' featured' : ''}`}>
    <div className="player-match-date"><strong>{inicio.getDate().toString().padStart(2, '0')}</strong><span>{inicio.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>
    <div className="player-match-info">
      <div className="player-match-title"><div><span>{partida.categoria || 'Todas as categorias'}</span><h3>{partida.modalidade}</h3></div><em className={lotada ? 'full' : ''}>{lotada ? 'Lotada' : 'Aberta'}</em></div>
      <div className="player-match-meta"><span><CalendarDays />{dataCurta.format(inicio)}</span><span><Clock3 />{hora.format(inicio)}</span><span><MapPin />{partida.local}</span><span><UsersRound />{quantidadeInscritos} de {partida.capacidade} jogadores</span></div>
      {statusInscricao ? <div className={`player-match-confirmed${statusInscricao === 'LISTA_ESPERA' ? ' waiting' : ''}`}>{statusInscricao === 'LISTA_ESPERA' ? <Clock3 /> : <CheckCircle2 />}<span><strong>{statusInscricao === 'LISTA_ESPERA' ? 'Você está na lista de espera' : 'Participação confirmada'}</strong><small>{statusInscricao === 'LISTA_ESPERA' ? 'A primeira pessoa da fila ocupa a próxima vaga.' : 'Esta partida já está na sua agenda.'}</small></span><Link to="/minhas-inscricoes">Ver inscrição</Link></div> : <button type="button" onClick={aoInscrever} disabled={bloqueado}>{enviando ? 'Confirmando...' : lotada ? <>Entrar na lista de espera <ChevronRight /></> : <>Quero participar <ChevronRight /></>}</button>}
    </div>
  </li>;
}

function Carregando() { return <div className="player-loading" aria-label="Carregando partidas"><i /><i /><i /></div>; }
function EstadoErro({ mensagem, tentar }: { mensagem: string; tentar: () => void }) { return <div className="player-empty"><CalendarDays /><h3>Não conseguimos carregar as partidas</h3><p>{mensagem}</p><button onClick={tentar}>Tentar novamente</button></div>; }
function EstadoVazio() { return <div className="player-empty"><CalendarDays /><h3>Nenhuma partida aberta agora</h3><p>Assim que uma nova partida abrir para inscrições, ela aparecerá aqui.</p></div>; }
function AvisoDeConta({ recusada = false }: { recusada?: boolean }) { return <div className="player-page"><div className={`player-empty player-account-warning${recusada ? ' refused' : ''}`}><UsersRound /><span>Cadastro</span><h1>{recusada ? 'Seu cadastro não foi aprovado' : 'Sua conta aguarda aprovação'}</h1><p>{recusada ? 'Entre em contato com o clube caso acredite que houve um engano.' : 'Um administrador precisa confirmar seu cadastro antes que você possa se inscrever em partidas.'}</p></div></div>; }
