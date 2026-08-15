import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../servicos/api';
import { formatarDataHora } from '../formatacao/data';
import { jogadorPartidaService } from '../servicos/jogadorPartidaService';
import type { InscricaoDoJogador, StatusInscricao } from '../servicos/tipos';

const rotulosStatus: Record<StatusInscricao, string> = {
  CONFIRMADA: 'Confirmada',
  LISTA_ESPERA: 'Lista de espera',
  CANCELADA: 'Cancelada',
  PRESENTE: 'Presença confirmada',
  AUSENTE: 'Ausente',
};

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível completar a operação.';
}

export function MinhasInscricoesPage() {
  const queryClient = useQueryClient();
  const inscricoes = useQuery({
    queryKey: ['inscricoes', 'minhas'],
    queryFn: jogadorPartidaService.listarMinhasInscricoes,
  });
  const cancelamento = useMutation({
    mutationFn: jogadorPartidaService.cancelarInscricao,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inscricoes', 'minhas'] }),
        queryClient.invalidateQueries({ queryKey: ['partidas', 'disponiveis'] }),
      ]);
    },
  });

  function cancelar(inscricao: InscricaoDoJogador) {
    if (window.confirm(`Cancelar sua inscrição na partida de ${formatarDataHora(inscricao.inicioDaPartida)}?`)) {
      cancelamento.mutate(inscricao.partidaId);
    }
  }

  return (
    <section aria-labelledby="titulo-inscricoes">
      <h1 id="titulo-inscricoes" className="text-2xl font-bold">Minhas inscrições</h1>
      <p className="mt-2 text-gray-600">Acompanhe e cancele suas próximas participações.</p>

      {cancelamento.isSuccess && <p role="status" className="mt-5 text-sm text-green-700">Inscrição cancelada.</p>}
      {cancelamento.isError && <p role="alert" className="mt-5 text-sm text-red-700">{mensagemDeErro(cancelamento.error)}</p>}
      {inscricoes.isPending && <p className="mt-6 text-gray-600">Carregando inscrições...</p>}
      {inscricoes.isError && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{mensagemDeErro(inscricoes.error)}</p>
          <button type="button" onClick={() => inscricoes.refetch()} className="mt-2 text-sm font-semibold underline">Tentar novamente</button>
        </div>
      )}
      {inscricoes.isSuccess && inscricoes.data.length === 0 && (
        <p className="mt-6 rounded border border-gray-200 bg-white p-6 text-gray-600">Você ainda não possui inscrições ativas.</p>
      )}
      {inscricoes.isSuccess && inscricoes.data.length > 0 && (
        <ul className="mt-6 space-y-3">
          {inscricoes.data.map((inscricao) => (
            <li key={inscricao.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-semibold">{formatarDataHora(inscricao.inicioDaPartida)}</h2>
                <p className="mt-1 text-sm text-gray-600">{inscricao.local}</p>
                <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{rotulosStatus[inscricao.status]}</span>
              </div>
              <button
                type="button"
                onClick={() => cancelar(inscricao)}
                disabled={cancelamento.isPending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {cancelamento.isPending && cancelamento.variables === inscricao.partidaId ? 'Cancelando...' : 'Cancelar inscrição'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
