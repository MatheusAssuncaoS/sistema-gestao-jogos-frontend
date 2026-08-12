import { useAuth } from '../contexto/useAuth';

/**
 * Home da área do jogador.
 *
 * No MVP essa página serve dois papéis: quem já foi aprovado vê a lista de
 * partidas (implementada na issue de listagem), e quem acabou de se
 * cadastrar vê a mensagem explicando que a conta aguarda aprovação, o que
 * evita a confusão de "cadastrei mas não consigo fazer nada".
 *
 * O critério de "conta ainda pendente" é o status PENDENTE ou a ausência do
 * papel JOGADOR: qualquer um dos dois indica que o administrador ainda não
 * aprovou.
 */
export function JogadorHome() {
  const { usuario } = useAuth();

  const aguardandoAprovacao =
    !usuario?.papeis.includes('JOGADOR') || usuario.status === 'PENDENTE';

  if (usuario?.status === 'RECUSADO') {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">
          Seu cadastro não foi aprovado
        </h1>
        <p className="mt-2 text-sm text-red-800">
          Um administrador do clube recusou este cadastro. Se você acredita
          que isso é um engano, entre em contato com o clube.
        </p>
      </div>
    );
  }

  if (aguardandoAprovacao) {
    return (
      <div className="rounded border border-yellow-200 bg-yellow-50 p-6">
        <h1 className="text-lg font-semibold text-yellow-900">
          Sua conta aguarda aprovação
        </h1>
        <p className="mt-2 text-sm text-yellow-800">
          Um administrador do clube precisa confirmar seu cadastro antes que
          você possa se inscrever em partidas. Assim que a aprovação sair,
          esta página passa a mostrar a agenda.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Partidas disponíveis</h1>
      <p className="mt-2 text-gray-600">
        A listagem de partidas será implementada na próxima issue.
      </p>
    </div>
  );
}
