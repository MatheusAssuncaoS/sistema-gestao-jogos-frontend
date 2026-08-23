import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Shuffle, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { arbitroService } from '../servicos/arbitroService';
import { ApiError } from '../servicos/api';
import type { Inscrito } from '../servicos/tipos';

type Time = 'AMARELO' | 'AZUL';
const data = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
const mensagemDeErro = (falha: unknown) => falha instanceof ApiError ? falha.detail : 'Não foi possível carregar os dados da partida.';

export function ArbitroPage() {
  const partidas = useQuery({ queryKey: ['arbitro', 'partidas'], queryFn: arbitroService.listarPartidas });
  const [partidaId, setPartidaId] = useState('');
  const [times, setTimes] = useState<Record<string, Time>>({});
  useEffect(() => { if (!partidaId && partidas.data?.length) setPartidaId(partidas.data[0].id); }, [partidaId, partidas.data]);
  useEffect(() => setTimes({}), [partidaId]);
  const participantes = useQuery({ queryKey: ['arbitro', 'participantes', partidaId], queryFn: () => arbitroService.listarParticipantes(partidaId), enabled: Boolean(partidaId) });
  const confirmados = useMemo(() => participantes.data?.filter((item) => item.status === 'CONFIRMADA' || item.status === 'PRESENTE') ?? [], [participantes.data]);
  const partida = partidas.data?.find((item) => item.id === partidaId);
  const amarelos = confirmados.filter((item) => times[item.jogadorId] === 'AMARELO');
  const azuis = confirmados.filter((item) => times[item.jogadorId] === 'AZUL');
  const semTime = confirmados.filter((item) => !times[item.jogadorId]);

  function atribuir(jogador: Inscrito, time: Time) { setTimes((atual) => ({ ...atual, [jogador.jogadorId]: time })); }
  function sortear() {
    const embaralhados = [...confirmados];
    for (let indice = embaralhados.length - 1; indice > 0; indice -= 1) {
      const sorteado = Math.floor(Math.random() * (indice + 1));
      [embaralhados[indice], embaralhados[sorteado]] = [embaralhados[sorteado], embaralhados[indice]];
    }
    setTimes(Object.fromEntries(embaralhados.map((jogador, indice) => [jogador.jogadorId, indice % 2 === 0 ? 'AMARELO' : 'AZUL'])));
  }

  return <div className="referee-page">
    <header className="referee-heading"><div><span>Central do árbitro</span><h1>Preparar partida</h1><p>Distribua os jogadores antes do apito inicial.</p></div><CalendarDays /></header>
    {partidas.isPending && <p>Carregando partidas...</p>}
    {partidas.isError && <div className="player-empty"><CalendarDays /><h3>Não conseguimos carregar as partidas</h3><p>{mensagemDeErro(partidas.error)}</p><button type="button" onClick={() => partidas.refetch()}>Tentar novamente</button></div>}
    {partidas.isSuccess && partidas.data.length === 0 && <div className="player-empty"><CalendarDays /><h3>Nenhuma partida disponível</h3><p>As próximas partidas aparecerão aqui.</p></div>}
    {partidas.data && partidas.data.length > 0 && <>
      <label className="referee-match-picker">Partida<select value={partidaId} onChange={(evento) => setPartidaId(evento.target.value)}>{partidas.data.map((item) => <option key={item.id} value={item.id}>{data.format(new Date(item.inicio))} — {item.local}</option>)}</select></label>
      {partida && <section className="referee-match-summary"><div><strong>{partida.modalidade}</strong><span><MapPin />{partida.local}</span></div><b>{confirmados.length} jogadores</b></section>}
      <button className="referee-shuffle" type="button" onClick={sortear} disabled={confirmados.length < 2}><Shuffle />Sortear times</button>
      {participantes.isPending && <p>Carregando jogadores...</p>}
      {participantes.isError && <div className="player-feedback error" role="alert">{mensagemDeErro(participantes.error)} <button type="button" onClick={() => participantes.refetch()}>Tentar novamente</button></div>}
      {participantes.isSuccess && <div className="referee-board">
        <TimeCard time="AMARELO" jogadores={amarelos} outroTime="AZUL" atribuir={atribuir} />
        <TimeCard time="AZUL" jogadores={azuis} outroTime="AMARELO" atribuir={atribuir} />
      </div>}
      {semTime.length > 0 && <section className="referee-unassigned"><header><UsersRound /><h2>Sem time</h2><span>{semTime.length}</span></header><ul>{semTime.map((jogador) => <li key={jogador.jogadorId}><Jogador jogador={jogador} /><div><button className="yellow" onClick={() => atribuir(jogador, 'AMARELO')}>Amarelo</button><button className="blue" onClick={() => atribuir(jogador, 'AZUL')}>Azul</button></div></li>)}</ul></section>}
    </>}
  </div>;
}

function TimeCard({ time, jogadores, outroTime, atribuir }: { time: Time; jogadores: Inscrito[]; outroTime: Time; atribuir: (jogador: Inscrito, time: Time) => void }) {
  return <section className={`referee-team ${time.toLowerCase()}`}><header><span>Time</span><h2>{time === 'AMARELO' ? 'Amarelo' : 'Azul'}</h2><b>{jogadores.length}</b></header><ul>{jogadores.map((jogador) => <li key={jogador.jogadorId}><Jogador jogador={jogador} /><button onClick={() => atribuir(jogador, outroTime)}>Mover</button></li>)}</ul>{jogadores.length === 0 && <p>Nenhum jogador neste time.</p>}</section>;
}

function Jogador({ jogador }: { jogador: Inscrito }) {
  return <div className="referee-player"><span>{jogador.nome.trim().charAt(0).toUpperCase()}</span><div><strong>{jogador.nome}</strong><small>{jogador.categoria ?? 'Sem categoria'}</small></div></div>;
}
