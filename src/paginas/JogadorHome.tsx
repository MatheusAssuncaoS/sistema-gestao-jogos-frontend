import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexto/useAuth';
import { formatarDataHora } from '../formatacao/data';
import { ApiError } from '../servicos/api';
import { jogadorPartidaService } from '../servicos/jogadorPartidaService';
import type { Partida } from '../servicos/tipos';

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError
    ? falha.detail
    : 'Não foi possível completar a operação. Tente novamente.';
}

export function JogadorHome() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const aguardandoAprovacao =
    !usuario?.papeis.includes('JOGADOR') || usuario.status === 'PENDENTE';

  const partidas = useQuery({
    queryKey: ['partidas', 'disponiveis'],
    queryFn: jogadorPartidaService.listarDisponiveis,
    enabled: !aguardandoAprovacao && usuario?.status !== 'RECUSADO',
  });

  const inscricao = useMutation({
    mutationFn: jogadorPartidaService.inscrever,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['partidas', 'disponiveis'] }),
        queryClient.invalidateQueries({ queryKey: ['inscricoes', 'minhas'] }),
      ]);
    },
  });

  if (usuario?.status === 'RECUSADO') {
    return <AvisoDeConta recusada />;
  }

  if (aguardandoAprovacao) {
    return <AvisoDeConta />;
  }

  return (
    <section aria-labelledby="titulo-partidas">
      <header>
        <h1 id="titulo-partidas" className="text-2xl font-bold">Partidas disponíveis</h1>
        <p className="mt-2 text-gray-600">
          Escolha uma partida aberta e confirme sua participação.
        </p>
      </header>

      {inscricao.isSuccess && (
        <p role="status" className="mt-5 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Inscrição realizada. Você pode acompanhá-la em “Minhas inscrições”.
        </p>
      )}

      {inscricao.isError && (
        <p role="alert" className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mensagemDeErro(inscricao.error)}
        </p>
      )}

      {partidas.isPending && <p className="mt-6 text-gray-600">Carregando partidas...</p>}
      {partidas.isError && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{mensagemDeErro(partidas.error)}</p>
          <button type="button" onClick={() => partidas.refetch()} className="mt-2 text-sm font-semibold underline">
            Tentar novamente
          </button>
        </div>
      )}

      {partidas.isSuccess && partidas.data.length === 0 && (
        <p className="mt-6 rounded border border-gray-200 bg-white p-6 text-gray-600">
          Nenhuma partida está aberta para inscrição no momento.
        </p>
      )}

      {partidas.isSuccess && partidas.data.length > 0 && (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {partidas.data.map((partida) => (
            <PartidaCard
              key={partida.id}
              partida={partida}
              enviando={inscricao.isPending && inscricao.variables === partida.id}
              bloqueado={inscricao.isPending}
              aoInscrever={() => inscricao.mutate(partida.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PartidaCard({
  partida,
  enviando,
  bloqueado,
  aoInscrever,
}: {
  partida: Partida;
  enviando: boolean;
  bloqueado: boolean;
  aoInscrever: () => void;
}) {
  const lotada = partida.status === 'LOTADA';

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">{partida.modalidade}</h2>
          <p className="mt-1 text-sm text-gray-600">{partida.local}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lotada ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
          {lotada ? 'Lotada' : 'Aberta'}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-gray-500">Data e horário</dt><dd className="mt-1 font-medium">{formatarDataHora(partida.inicio)}</dd></div>
        <div><dt className="text-gray-500">Capacidade</dt><dd className="mt-1 font-medium">{partida.capacidade} jogadores</dd></div>
        {partida.categoria && <div><dt className="text-gray-500">Categoria</dt><dd className="mt-1 font-medium">{partida.categoria}</dd></div>}
      </dl>
      <button
        type="button"
        onClick={aoInscrever}
        disabled={bloqueado || lotada}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {enviando ? 'Confirmando...' : lotada ? 'Sem vagas' : 'Inscrever-se'}
      </button>
    </li>
  );
}

function AvisoDeConta({ recusada = false }: { recusada?: boolean }) {
  return (
    <div className={`rounded border p-6 ${recusada ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <h1 className={`text-lg font-semibold ${recusada ? 'text-red-900' : 'text-yellow-900'}`}>
        {recusada ? 'Seu cadastro não foi aprovado' : 'Sua conta aguarda aprovação'}
      </h1>
      <p className={`mt-2 text-sm ${recusada ? 'text-red-800' : 'text-yellow-800'}`}>
        {recusada
          ? 'Um administrador do clube recusou este cadastro. Se você acredita que isso é um engano, entre em contato com o clube.'
          : 'Um administrador precisa confirmar seu cadastro antes que você possa se inscrever em partidas.'}
      </p>
    </div>
  );
}
