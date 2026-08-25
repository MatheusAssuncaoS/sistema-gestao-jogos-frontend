import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeAlert, CalendarDays, ChevronRight, Clock3, Flag, MapPin, Minus, Pause, Play, Plus, Shuffle, TimerReset, TriangleAlert, UserMinus, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { arbitroService, type StatusArbitragem } from '../servicos/arbitroService';
import { ApiError } from '../servicos/api';
import type { Inscrito, Partida } from '../servicos/tipos';
import { PainelOperacionalLayout } from '../componentes/PainelOperacionalLayout';

type Time = 'AMARELO' | 'AZUL';
type Gol = { id: string; time: Time; jogador: Inscrito; segundo: number };
type TipoCartao = 'AMARELO' | 'VERMELHO';
type Punicao = { id: string; time: Time; jogador: Inscrito; tipo: TipoCartao; motivo: string; segundo: number };
const mensagemDeErro = (falha: unknown) => falha instanceof ApiError ? falha.detail : 'Não foi possível carregar os dados da partida.';

export function ArbitroPage() {
  const queryClient = useQueryClient();
  const partidas = useQuery({ queryKey: ['arbitro', 'partidas'], queryFn: arbitroService.listarPartidas });
  const consultasDeEstado = useQueries({ queries: (partidas.data ?? []).map((partida) => ({ queryKey: ['arbitro', 'estado', partida.id], queryFn: () => arbitroService.obterEstado(partida.id) })) });
  const [partidaId, setPartidaId] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [times, setTimes] = useState<Record<string, Time>>({});
  const [partidaIniciada, setPartidaIniciada] = useState(false);
  const [cronometroRodando, setCronometroRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [gols, setGols] = useState<Gol[]>([]);
  const [punicoes, setPunicoes] = useState<Punicao[]>([]);
  const [acrescimos, setAcrescimos] = useState(0);
  const [partidaFinalizada, setPartidaFinalizada] = useState(false);
  const [revisaoLocal, setRevisaoLocal] = useState(0);
  const [estadoHidratado, setEstadoHidratado] = useState('');
  const [erroPersistencia, setErroPersistencia] = useState<string | null>(null);
  const versaoRef = useRef(0);
  const segundosRef = useRef(0);
  const filaPersistenciaRef = useRef<Promise<void>>(Promise.resolve());
  segundosRef.current = segundos;
  useEffect(() => {
    if (diaSelecionado || !partidas.data?.length) return;
    const dias = [...new Set(partidas.data.map((item) => chaveDoDia(item.inicio)))].sort();
    const hoje = chaveDoDia(new Date().toISOString());
    setDiaSelecionado(dias.includes(hoje) ? hoje : dias[0]);
  }, [diaSelecionado, partidas.data]);
  useEffect(() => { setTimes({}); setPartidaIniciada(false); setCronometroRodando(false); setSegundos(0); setGols([]); setPunicoes([]); setAcrescimos(0); setPartidaFinalizada(false); setRevisaoLocal(0); setEstadoHidratado(''); setErroPersistencia(null); versaoRef.current = 0; }, [partidaId]);
  useEffect(() => {
    if (!cronometroRodando) return;
    const intervalo = window.setInterval(() => setSegundos((atual) => atual + 1), 1000);
    return () => window.clearInterval(intervalo);
  }, [cronometroRodando]);
  const participantes = useQuery({ queryKey: ['arbitro', 'participantes', partidaId], queryFn: () => arbitroService.listarParticipantes(partidaId), enabled: Boolean(partidaId) });
  const estadoArbitragem = useQuery({ queryKey: ['arbitro', 'estado', partidaId], queryFn: () => arbitroService.obterEstado(partidaId), enabled: Boolean(partidaId) });
  const confirmados = useMemo(() => participantes.data?.filter((item) => item.status === 'CONFIRMADA' || item.status === 'PRESENTE') ?? [], [participantes.data]);
  const partida = partidas.data?.find((item) => item.id === partidaId);
  const amarelos = confirmados.filter((item) => times[item.jogadorId] === 'AMARELO');
  const azuis = confirmados.filter((item) => times[item.jogadorId] === 'AZUL');
  const semTime = confirmados.filter((item) => !times[item.jogadorId]);
  const limitePorTime = Math.ceil(confirmados.length / 2);
  const quantidadeImpar = confirmados.length % 2 !== 0;
  const estadosPorPartida = Object.fromEntries(consultasDeEstado.flatMap((consulta) => consulta.data ? [[consulta.data.partidaId, consulta.data.status]] : []));

  useEffect(() => {
    if (!partidaId || !estadoArbitragem.data || !participantes.data || estadoHidratado === partidaId) return;
    const porId = new Map(participantes.data.map((jogador) => [jogador.jogadorId, jogador]));
    const estado = estadoArbitragem.data;
    setTimes(estado.dados.escala);
    setSegundos(estado.segundos);
    setCronometroRodando(estado.status === 'EM_ANDAMENTO');
    setPartidaIniciada(estado.status !== 'PREPARACAO');
    setPartidaFinalizada(estado.status === 'FINALIZADA');
    setAcrescimos(estado.dados.acrescimos);
    setGols(estado.dados.gols.flatMap((gol) => { const jogador = porId.get(gol.jogadorId); return jogador ? [{ ...gol, jogador }] : []; }));
    setPunicoes(estado.dados.punicoes.flatMap((punicao) => { const jogador = porId.get(punicao.jogadorId); return jogador ? [{ ...punicao, jogador }] : []; }));
    versaoRef.current = estado.versao;
    setEstadoHidratado(partidaId);
  }, [estadoArbitragem.data, estadoHidratado, partidaId, participantes.data]);

  useEffect(() => {
    if (!partidaId || estadoHidratado !== partidaId || revisaoLocal === 0) return;
    const status: StatusArbitragem = partidaFinalizada ? 'FINALIZADA' : partidaIniciada ? cronometroRodando ? 'EM_ANDAMENTO' : 'PAUSADA' : 'PREPARACAO';
    const payload = {
      status,
      segundos: segundosRef.current,
      dados: {
        acrescimos,
        escala: times,
        gols: gols.map((gol) => ({ id: gol.id, time: gol.time, jogadorId: gol.jogador.jogadorId, segundo: gol.segundo })),
        punicoes: punicoes.map((punicao) => ({ id: punicao.id, time: punicao.time, jogadorId: punicao.jogador.jogadorId, tipo: punicao.tipo, motivo: punicao.motivo, segundo: punicao.segundo })),
      },
    };
    const atraso = window.setTimeout(() => {
      filaPersistenciaRef.current = filaPersistenciaRef.current.then(async () => {
        const salvo = await arbitroService.salvarEstado(partidaId, { ...payload, versao: versaoRef.current });
        versaoRef.current = salvo.versao;
        queryClient.setQueryData(['arbitro', 'estado', partidaId], salvo);
        setErroPersistencia(null);
      }).catch((falha: unknown) => setErroPersistencia(mensagemDeErro(falha)));
    }, 250);
    return () => window.clearTimeout(atraso);
  }, [acrescimos, cronometroRodando, estadoHidratado, gols, partidaFinalizada, partidaId, partidaIniciada, punicoes, queryClient, revisaoLocal, times]);

  function marcarAlteracao() { setRevisaoLocal((atual) => atual + 1); }

  function atribuir(jogador: Inscrito, time: Time) {
    const jogadoresNoDestino = time === 'AMARELO' ? amarelos.length : azuis.length;
    if (times[jogador.jogadorId] !== time && jogadoresNoDestino >= limitePorTime) return;
    setTimes((atual) => ({ ...atual, [jogador.jogadorId]: time }));
    marcarAlteracao();
  }
  function removerDoTime(jogador: Inscrito) {
    setTimes((atual) => {
      const atualizados = { ...atual };
      delete atualizados[jogador.jogadorId];
      return atualizados;
    });
    marcarAlteracao();
  }
  function sortear() {
    const embaralhados = [...confirmados];
    for (let indice = embaralhados.length - 1; indice > 0; indice -= 1) {
      const sorteado = Math.floor(Math.random() * (indice + 1));
      [embaralhados[indice], embaralhados[sorteado]] = [embaralhados[sorteado], embaralhados[indice]];
    }
    setTimes(Object.fromEntries(embaralhados.map((jogador, indice) => [jogador.jogadorId, indice % 2 === 0 ? 'AMARELO' : 'AZUL'])));
    marcarAlteracao();
  }

  function iniciarPartida() { setPartidaIniciada(true); setCronometroRodando(true); marcarAlteracao(); }
  function registrarGol(time: Time, jogador: Inscrito) { setGols((atuais) => [...atuais, { id: `${Date.now()}-${jogador.jogadorId}`, time, jogador, segundo: segundos }]); marcarAlteracao(); }
  function removerUltimoGol(time: Time) {
    setGols((atuais) => {
      const indice = atuais.findLastIndex((gol) => gol.time === time);
      return indice < 0 ? atuais : atuais.filter((_, atual) => atual !== indice);
    });
    marcarAlteracao();
  }
  function voltarParaPartidas() { setPartidaId(''); }

  if (!partidaId) return <PainelOperacionalLayout ambiente="arbitro"><AgendaDoArbitro partidas={partidas.data ?? []} estados={estadosPorPartida} carregando={partidas.isPending} erro={partidas.isError ? mensagemDeErro(partidas.error) : null} tentar={() => partidas.refetch()} diaSelecionado={diaSelecionado} selecionarDia={setDiaSelecionado} selecionarPartida={setPartidaId} /></PainelOperacionalLayout>;

  if (estadoArbitragem.isError || participantes.isError) return <PainelOperacionalLayout ambiente="arbitro"><div className="player-empty"><CalendarDays /><h3>Não conseguimos recuperar a partida</h3><p>{mensagemDeErro(estadoArbitragem.error ?? participantes.error)}</p><button type="button" onClick={() => { estadoArbitragem.refetch(); participantes.refetch(); }}>Tentar novamente</button></div></PainelOperacionalLayout>;

  if (participantes.isPending || estadoArbitragem.isPending || estadoHidratado !== partidaId) return <PainelOperacionalLayout ambiente="arbitro"><div className="referee-schedule-page"><div className="player-loading"><i /><i /></div></div></PainelOperacionalLayout>;

  if (partidaIniciada && partida) return <PainelOperacionalLayout ambiente="arbitro"><div className="admin-breadcrumb"><span>Arbitragem</span><b>/</b> Partida em andamento</div>{erroPersistencia && <div className="player-feedback error" role="alert">{erroPersistencia}</div>}<PartidaEmAndamento partida={partida} amarelos={amarelos} azuis={azuis} segundos={segundos} rodando={cronometroRodando} gols={gols} punicoes={punicoes} acrescimos={acrescimos} partidaFinalizada={partidaFinalizada} alternarCronometro={() => { setCronometroRodando((atual) => !atual); marcarAlteracao(); }} zerarCronometro={() => { setCronometroRodando(false); setSegundos(0); setAcrescimos(0); marcarAlteracao(); }} registrarGol={registrarGol} removerUltimoGol={removerUltimoGol} atualizarPunicoes={(novas) => { setPunicoes(novas); marcarAlteracao(); }} atualizarAcrescimos={(valor) => { setAcrescimos(valor); marcarAlteracao(); }} finalizar={() => { setCronometroRodando(false); setPartidaFinalizada(true); marcarAlteracao(); }} voltar={voltarParaPartidas} /></PainelOperacionalLayout>;

  return <PainelOperacionalLayout ambiente="arbitro"><div className="admin-breadcrumb"><span>Arbitragem</span><b>/</b> Preparar partida</div><div className="referee-page admin-card">
    <button type="button" className="referee-preparation-back" onClick={() => setPartidaId('')}><ArrowLeft aria-hidden="true" />Partidas do dia</button>
    <header className="referee-heading"><div><span>Central do árbitro</span><h1>Preparar partida</h1><p>Distribua os jogadores antes do apito inicial.</p></div><CalendarDays /></header>
    {erroPersistencia && <div className="player-feedback error" role="alert">{erroPersistencia}</div>}
    {partida && <>
      {partida && <section className="referee-match-summary"><div><strong>{partida.modalidade}</strong><span><MapPin />{partida.local}</span></div><b>{confirmados.length} jogadores</b></section>}
      <button className="referee-shuffle" type="button" onClick={sortear} disabled={confirmados.length < 2}><Shuffle />Sortear times</button>
      {quantidadeImpar && <div className="referee-balance-warning" role="status"><TriangleAlert aria-hidden="true" /><div><strong>Quantidade ímpar de jogadores</strong><p>Não é possível formar times iguais. A partida poderá prosseguir com {limitePorTime} jogadores em um time e {Math.floor(confirmados.length / 2)} no outro.</p></div></div>}
      <div className="referee-board">
        <TimeCard time="AMARELO" jogadores={amarelos} outroTime="AZUL" limite={limitePorTime} destinoCheio={azuis.length >= limitePorTime} atribuir={atribuir} remover={removerDoTime} />
        <TimeCard time="AZUL" jogadores={azuis} outroTime="AMARELO" limite={limitePorTime} destinoCheio={amarelos.length >= limitePorTime} atribuir={atribuir} remover={removerDoTime} />
      </div>
      {semTime.length > 0 && <section className="referee-unassigned"><header><UsersRound /><h2>Sem time</h2><span>{semTime.length}</span></header><ul>{semTime.map((jogador) => <li key={jogador.jogadorId}><Jogador jogador={jogador} /><div><button className="yellow" disabled={amarelos.length >= limitePorTime} onClick={() => atribuir(jogador, 'AMARELO')}>Amarelo</button><button className="blue" disabled={azuis.length >= limitePorTime} onClick={() => atribuir(jogador, 'AZUL')}>Azul</button></div></li>)}</ul></section>}
      <section className="referee-start-card"><div><span>Times preparados</span><h2>Pronto para começar?</h2><p>{semTime.length > 0 ? `Distribua os ${semTime.length} jogadores que ainda estão sem time.` : amarelos.length === 0 || azuis.length === 0 ? 'Os dois times precisam ter ao menos um jogador.' : `${amarelos.length + azuis.length} jogadores distribuídos. Ao iniciar, o cronômetro começa automaticamente.`}</p></div><button type="button" onClick={iniciarPartida} disabled={semTime.length > 0 || amarelos.length === 0 || azuis.length === 0}><Play aria-hidden="true" />Iniciar partida</button></section>
    </>}
  </div></PainelOperacionalLayout>;
}

function AgendaDoArbitro({ partidas, estados, carregando, erro, tentar, diaSelecionado, selecionarDia, selecionarPartida }: { partidas: Partida[]; estados: Record<string, StatusArbitragem>; carregando: boolean; erro: string | null; tentar: () => void; diaSelecionado: string; selecionarDia: (dia: string) => void; selecionarPartida: (id: string) => void }) {
  const dias = [...new Set(partidas.map((partida) => chaveDoDia(partida.inicio)))].sort();
  const partidasDoDia = partidas.filter((partida) => chaveDoDia(partida.inicio) === diaSelecionado).sort((a, b) => a.inicio.localeCompare(b.inicio));
  return <div className="referee-schedule-page">
    <header className="referee-schedule-heading"><div><span>Central do árbitro</span><h1>Partidas do dia</h1><p>Escolha a partida que você vai apitar.</p></div><CalendarDays aria-hidden="true" /></header>
    {carregando && <div className="player-loading"><i /><i /></div>}
    {erro && <div className="player-empty"><CalendarDays /><h3>Não conseguimos carregar as partidas</h3><p>{erro}</p><button type="button" onClick={tentar}>Tentar novamente</button></div>}
    {!carregando && !erro && partidas.length === 0 && <div className="player-empty"><CalendarDays /><h3>Nenhuma partida disponível</h3><p>As partidas escaladas para você aparecerão aqui.</p></div>}
    {dias.length > 0 && <nav className="referee-day-tabs" aria-label="Dias com partidas">{dias.map((dia) => { const valor = new Date(`${dia}T12:00:00`); return <button type="button" key={dia} className={dia === diaSelecionado ? 'active' : ''} onClick={() => selecionarDia(dia)}><span>{valor.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><strong>{valor.getDate().toString().padStart(2, '0')}</strong><small>{valor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></button>; })}</nav>}
    {partidasDoDia.length > 0 && <ul className="referee-schedule-list">{partidasDoDia.map((partida, indice) => { const inicio = new Date(partida.inicio); const inscritos = partida.quantidadeInscritos ?? 0; const estado = estados[partida.id] ?? 'PREPARACAO'; const cancelada = partida.status === 'CANCELADA'; const emAndamento = estado === 'EM_ANDAMENTO'; const pausada = estado === 'PAUSADA'; const finalizada = estado === 'FINALIZADA' || partida.status === 'FINALIZADA'; const rotulo = cancelada ? 'Cancelada' : finalizada ? 'Finalizada' : emAndamento ? 'Em andamento' : pausada ? 'Pausada' : 'Programada'; return <li key={partida.id} className={`${indice === 0 ? 'featured ' : ''}${emAndamento ? 'ongoing' : finalizada ? 'finished' : pausada ? 'paused' : ''}`}><div className="referee-schedule-time"><Clock3 aria-hidden="true" /><strong>{inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong><span className={emAndamento ? 'live' : ''}>{emAndamento && <i aria-hidden="true" />}{rotulo}</span></div><div className="referee-schedule-info"><header><div><span>{partida.categoria || 'Todas as categorias'}</span><h2>{partida.modalidade}</h2></div><em>{inscritos} jogadores</em></header><div className="referee-schedule-meta"><span><MapPin aria-hidden="true" />{partida.local}</span><span><UsersRound aria-hidden="true" />{inscritos} de {partida.capacidade} inscritos</span></div><button type="button" onClick={() => selecionarPartida(partida.id)} disabled={cancelada}>{cancelada ? 'Partida indisponível' : <>{finalizada ? 'Ver resultado' : emAndamento || pausada ? 'Continuar partida' : 'Apitar partida'} <ChevronRight aria-hidden="true" /></>}</button></div></li>; })}</ul>}
  </div>;
}

function chaveDoDia(inicio: string) {
  const valor = new Date(inicio);
  const ano = valor.getFullYear();
  const mes = (valor.getMonth() + 1).toString().padStart(2, '0');
  const dia = valor.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function PartidaEmAndamento({ partida, amarelos, azuis, segundos, rodando, gols, punicoes, acrescimos, partidaFinalizada, alternarCronometro, zerarCronometro, registrarGol, removerUltimoGol, atualizarPunicoes, atualizarAcrescimos, finalizar, voltar }: { partida: { modalidade: string; local: string }; amarelos: Inscrito[]; azuis: Inscrito[]; segundos: number; rodando: boolean; gols: Gol[]; punicoes: Punicao[]; acrescimos: number; partidaFinalizada: boolean; alternarCronometro: () => void; zerarCronometro: () => void; registrarGol: (time: Time, jogador: Inscrito) => void; removerUltimoGol: (time: Time) => void; atualizarPunicoes: (punicoes: Punicao[]) => void; atualizarAcrescimos: (valor: number) => void; finalizar: () => void; voltar: () => void }) {
  const [selecionandoArtilheiro, setSelecionandoArtilheiro] = useState<Time | null>(null);
  const [menuPunicaoAberto, setMenuPunicaoAberto] = useState(false);
  const [selecionandoPunicao, setSelecionandoPunicao] = useState<{ time: Time; jogador: Inscrito } | null>(null);
  const [motivoPunicao, setMotivoPunicao] = useState('');
  const [editandoAcrescimos, setEditandoAcrescimos] = useState(false);
  const jogadoresDoTime = selecionandoArtilheiro === 'AMARELO' ? amarelos : azuis;
  const placar = { AMARELO: gols.filter((gol) => gol.time === 'AMARELO').length, AZUL: gols.filter((gol) => gol.time === 'AZUL').length };
  function registrarPunicao(tipo: TipoCartao) {
    if (!selecionandoPunicao) return;
    atualizarPunicoes([...punicoes, { id: `${Date.now()}-${selecionandoPunicao.jogador.jogadorId}-${tipo}`, ...selecionandoPunicao, tipo, motivo: motivoPunicao.trim(), segundo: segundos }]);
    setSelecionandoPunicao(null);
    setMotivoPunicao('');
  }
  function finalizarPartida() {
    if (!window.confirm(`Finalizar a partida com o placar ${placar.AMARELO} × ${placar.AZUL}?`)) return;
    setEditandoAcrescimos(false);
    setSelecionandoArtilheiro(null);
    setMenuPunicaoAberto(false);
    setSelecionandoPunicao(null);
    finalizar();
  }
  return <div className="referee-live-page">
    <header className="referee-live-heading"><button type="button" onClick={voltar}><ArrowLeft aria-hidden="true" />Voltar às partidas</button><div><span>{partidaFinalizada ? 'Partida encerrada' : 'Partida em andamento'}</span><h1>{partida.modalidade}</h1><p><MapPin aria-hidden="true" />{partida.local}</p></div><em className={partidaFinalizada ? 'finished' : rodando ? 'running' : ''}><i />{partidaFinalizada ? 'Finalizada' : rodando ? 'Em andamento' : 'Pausada'}</em></header>
    <section className="referee-scoreboard" aria-label="Placar da partida">
      <PlacarTime time="AMARELO" jogadores={amarelos} gols={placar.AMARELO} bloqueado={partidaFinalizada} adicionar={() => setSelecionandoArtilheiro('AMARELO')} remover={() => removerUltimoGol('AMARELO')} />
      <div className="referee-clock"><span>Tempo de jogo</span><strong>{formatarTempo(segundos)}</strong>{acrescimos > 0 && <em className="referee-added-time">+{acrescimos} min de acréscimos</em>}<div><button type="button" className="primary" disabled={partidaFinalizada} onClick={alternarCronometro}>{rodando ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{rodando ? 'Pausar' : 'Retomar'}</button><button type="button" className="added-time" disabled={partidaFinalizada} onClick={() => setEditandoAcrescimos((aberto) => !aberto)} aria-expanded={editandoAcrescimos}><Clock3 aria-hidden="true" />Acréscimos{acrescimos > 0 ? ` +${acrescimos}` : ''}</button><button type="button" disabled={partidaFinalizada} onClick={() => { zerarCronometro(); setEditandoAcrescimos(false); }} aria-label="Zerar cronômetro"><TimerReset aria-hidden="true" />Zerar</button></div></div>
      <PlacarTime time="AZUL" jogadores={azuis} gols={placar.AZUL} bloqueado={partidaFinalizada} adicionar={() => setSelecionandoArtilheiro('AZUL')} remover={() => removerUltimoGol('AZUL')} />
    </section>
    {editandoAcrescimos && <section className="referee-added-time-panel" aria-label="Definir acréscimos"><div><Clock3 aria-hidden="true" /><span><strong>Tempo de acréscimos</strong><small>Informe quantos minutos serão adicionados.</small></span></div><div className="referee-added-time-stepper"><button type="button" onClick={() => atualizarAcrescimos(Math.max(0, acrescimos - 1))} disabled={acrescimos === 0} aria-label="Diminuir acréscimos"><Minus aria-hidden="true" /></button><output aria-live="polite">+{acrescimos} min</output><button type="button" onClick={() => atualizarAcrescimos(Math.min(30, acrescimos + 1))} disabled={acrescimos === 30} aria-label="Aumentar acréscimos"><Plus aria-hidden="true" /></button></div><button type="button" className="confirm" onClick={() => setEditandoAcrescimos(false)}>Confirmar</button></section>}
    {partidaFinalizada ? <section className="referee-finished-banner"><Flag aria-hidden="true" /><div><span>Partida finalizada</span><strong>Time Amarelo {placar.AMARELO} × {placar.AZUL} Time Azul</strong><small>Tempo total: {formatarTempo(segundos)}{acrescimos > 0 ? ` · ${acrescimos} min de acréscimos` : ''}</small></div></section> : <div className="referee-match-actions"><button type="button" className="referee-discipline-action" onClick={() => { setSelecionandoArtilheiro(null); setMenuPunicaoAberto(true); }}><BadgeAlert aria-hidden="true" /><span><strong>Aplicar cartão</strong><small>Selecione o jogador e registre a infração</small></span></button><button type="button" className="referee-finish-action" onClick={finalizarPartida}><Flag aria-hidden="true" /><span><strong>Finalizar partida</strong><small>Encerra o cronômetro e confirma o placar</small></span></button></div>}
    {selecionandoArtilheiro && <section className={`referee-scorer-picker ${selecionandoArtilheiro.toLowerCase()}`} role="dialog" aria-modal="true" aria-labelledby="scorer-title"><header><div><span>Registrar gol</span><h2 id="scorer-title">Quem marcou pelo time {selecionandoArtilheiro === 'AMARELO' ? 'Amarelo' : 'Azul'}?</h2><p>O gol será registrado aos {formatarTempo(segundos)}.</p></div><button type="button" onClick={() => setSelecionandoArtilheiro(null)}>Cancelar</button></header><ul>{jogadoresDoTime.map((jogador) => <li key={jogador.jogadorId}><button type="button" onClick={() => { registrarGol(selecionandoArtilheiro, jogador); setSelecionandoArtilheiro(null); }}><Jogador jogador={jogador} /><Plus aria-hidden="true" /></button></li>)}</ul></section>}
    {menuPunicaoAberto && <SeletorDeJogadorParaPunicao amarelos={amarelos} azuis={azuis} punicoes={punicoes} fechar={() => setMenuPunicaoAberto(false)} selecionar={(time, jogador) => { setMenuPunicaoAberto(false); setSelecionandoPunicao({ time, jogador }); }} />}
    {selecionandoPunicao && <section className="referee-card-picker" role="dialog" aria-modal="true" aria-labelledby="card-title"><header><div><span>Punição disciplinar</span><h2 id="card-title">Aplicar cartão a {selecionandoPunicao.jogador.nome}</h2><p>Time {selecionandoPunicao.time === 'AMARELO' ? 'Amarelo' : 'Azul'} · {formatarTempo(segundos)}</p></div><button type="button" onClick={() => { setSelecionandoPunicao(null); setMotivoPunicao(''); setMenuPunicaoAberto(true); }}>Voltar aos jogadores</button></header><div className="referee-card-form"><label>Motivo da punição <input value={motivoPunicao} onChange={(evento) => setMotivoPunicao(evento.target.value)} maxLength={120} placeholder="Ex.: falta antidesportiva (opcional)" /></label><div><button className="yellow" type="button" onClick={() => registrarPunicao('AMARELO')}><i />Cartão amarelo</button><button className="red" type="button" onClick={() => registrarPunicao('VERMELHO')}><i />Cartão vermelho</button></div></div></section>}
    <RegistroDeGols gols={gols} />
    <RegistroDePunicoes punicoes={punicoes} remover={(id) => atualizarPunicoes(punicoes.filter((punicao) => punicao.id !== id))} />
    <div className="referee-live-rosters"><Elenco time="AMARELO" jogadores={amarelos} punicoes={punicoes} /><Elenco time="AZUL" jogadores={azuis} punicoes={punicoes} /></div>
  </div>;
}

function PlacarTime({ time, jogadores, gols, bloqueado, adicionar, remover }: { time: Time; jogadores: Inscrito[]; gols: number; bloqueado: boolean; adicionar: () => void; remover: () => void }) {
  return <div className={`referee-score-team ${time.toLowerCase()}`}><span>Time {time === 'AMARELO' ? 'Amarelo' : 'Azul'}</span><strong>{gols}</strong><small>{jogadores.length} jogadores</small><div><button type="button" onClick={remover} disabled={bloqueado || gols === 0} aria-label={`Remover último gol do time ${time.toLowerCase()}`}><Minus /></button><button type="button" onClick={adicionar} disabled={bloqueado} aria-label={`Registrar gol do time ${time.toLowerCase()}`}><Plus /></button></div></div>;
}

function RegistroDeGols({ gols }: { gols: Gol[] }) {
  return <section className="referee-goal-log"><header><div><span>Resumo da partida</span><h2>Gols registrados</h2></div><b>{gols.length}</b></header>{gols.length === 0 ? <p>Nenhum gol registrado até agora.</p> : <ol>{[...gols].reverse().map((gol) => <li key={gol.id}><span className={`goal-team ${gol.time.toLowerCase()}`} /> <div><strong>{gol.jogador.nome}</strong><small>Time {gol.time === 'AMARELO' ? 'Amarelo' : 'Azul'}</small></div><time>{formatarMinuto(gol.segundo)}</time></li>)}</ol>}</section>;
}

function RegistroDePunicoes({ punicoes, remover }: { punicoes: Punicao[]; remover: (id: string) => void }) {
  const registros = punicoes.map((punicao, indice) => ({ punicao, amarelos: punicoes.slice(0, indice + 1).filter((item) => item.jogador.jogadorId === punicao.jogador.jogadorId && item.tipo === 'AMARELO').length })).reverse();
  return <section className="referee-card-log"><header><div><span>Disciplina</span><h2>Cartões e punições</h2></div><b>{punicoes.length}</b></header>{punicoes.length === 0 ? <p>Nenhum cartão aplicado nesta partida.</p> : <ol>{registros.map(({ punicao, amarelos }) => { const expulso = punicao.tipo === 'VERMELHO' || amarelos >= 2; return <li key={punicao.id}><i className={`referee-card ${punicao.tipo.toLowerCase()}`} /><div><strong>{punicao.jogador.nome}</strong><small>{punicao.tipo === 'AMARELO' && amarelos >= 2 ? 'Segundo amarelo — expulso' : `Cartão ${punicao.tipo.toLowerCase()}`}{punicao.motivo ? ` · ${punicao.motivo}` : ''}</small></div>{expulso && <em>Expulso</em>}<time>{formatarMinuto(punicao.segundo)}</time><button type="button" onClick={() => remover(punicao.id)} aria-label={`Remover punição de ${punicao.jogador.nome}`}>×</button></li>; })}</ol>}</section>;
}

function SeletorDeJogadorParaPunicao({ amarelos, azuis, punicoes, fechar, selecionar }: { amarelos: Inscrito[]; azuis: Inscrito[]; punicoes: Punicao[]; fechar: () => void; selecionar: (time: Time, jogador: Inscrito) => void }) {
  const grupo = (time: Time, jogadores: Inscrito[]) => <div className={`referee-discipline-team ${time.toLowerCase()}`}><h3>Time {time === 'AMARELO' ? 'Amarelo' : 'Azul'}</h3><ul>{jogadores.map((jogador) => { const doJogador = punicoes.filter((punicao) => punicao.jogador.jogadorId === jogador.jogadorId); const expulso = doJogador.filter((punicao) => punicao.tipo === 'AMARELO').length >= 2 || doJogador.some((punicao) => punicao.tipo === 'VERMELHO'); return <li key={jogador.jogadorId}><button type="button" disabled={expulso} onClick={() => selecionar(time, jogador)}><Jogador jogador={jogador} />{expulso ? <em>Expulso</em> : <BadgeAlert aria-hidden="true" />}</button></li>; })}</ul></div>;
  return <section className="referee-discipline-picker" role="dialog" aria-modal="true" aria-labelledby="discipline-title"><header><div><span>Infração</span><h2 id="discipline-title">Qual jogador receberá o cartão?</h2><p>Escolha um jogador de um dos times.</p></div><button type="button" onClick={fechar}>Cancelar</button></header><div className="referee-discipline-teams">{grupo('AMARELO', amarelos)}{grupo('AZUL', azuis)}</div></section>;
}

function Elenco({ time, jogadores, punicoes }: { time: Time; jogadores: Inscrito[]; punicoes: Punicao[] }) {
  return <section className={`referee-live-roster ${time.toLowerCase()}`}><header><div><span>Time</span><h2>{time === 'AMARELO' ? 'Amarelo' : 'Azul'}</h2></div><b>{jogadores.length}</b></header><ul>{jogadores.map((jogador) => { const doJogador = punicoes.filter((punicao) => punicao.jogador.jogadorId === jogador.jogadorId); const amarelos = doJogador.filter((punicao) => punicao.tipo === 'AMARELO').length; const expulso = amarelos >= 2 || doJogador.some((punicao) => punicao.tipo === 'VERMELHO'); return <li key={jogador.jogadorId} className={expulso ? 'sent-off' : ''}><Jogador jogador={jogador} /><div className="referee-player-discipline">{amarelos > 0 && <span className="yellow-card">{amarelos}</span>}{doJogador.some((punicao) => punicao.tipo === 'VERMELHO') && <span className="red-card" />}{expulso && <em>Expulso</em>}</div></li>; })}</ul></section>;
}

function formatarTempo(total: number) {
  const minutos = Math.floor(total / 60).toString().padStart(2, '0');
  const segundos = (total % 60).toString().padStart(2, '0');
  return `${minutos}:${segundos}`;
}

function formatarMinuto(segundos: number) { return `${Math.floor(segundos / 60) + 1}′`; }

function TimeCard({ time, jogadores, outroTime, limite, destinoCheio, atribuir, remover }: { time: Time; jogadores: Inscrito[]; outroTime: Time; limite: number; destinoCheio: boolean; atribuir: (jogador: Inscrito, time: Time) => void; remover: (jogador: Inscrito) => void }) {
  return <section className={`referee-team ${time.toLowerCase()}`}><header><span>Time</span><h2>{time === 'AMARELO' ? 'Amarelo' : 'Azul'}</h2><b aria-label={`${jogadores.length} de ${limite} jogadores`}>{jogadores.length}/{limite}</b></header><ul>{jogadores.map((jogador) => <li key={jogador.jogadorId}><Jogador jogador={jogador} /><div className="referee-team-actions"><button className="remove" onClick={() => remover(jogador)} aria-label={`Remover ${jogador.nome} do time`}><UserMinus aria-hidden="true" /><span>Remover</span></button><button disabled={destinoCheio} onClick={() => atribuir(jogador, outroTime)} title={destinoCheio ? 'O outro time atingiu o limite' : undefined}><span>Mover</span></button></div></li>)}</ul>{jogadores.length === 0 && <p>Nenhum jogador neste time.</p>}</section>;
}

function Jogador({ jogador }: { jogador: Inscrito }) {
  return <div className="referee-player"><span>{jogador.nome.trim().charAt(0).toUpperCase()}</span><div><strong>{jogador.nome}</strong><small>{jogador.categoria ?? 'Sem categoria'}</small></div></div>;
}
