import { Link } from 'react-router-dom';

export function NaoEncontradaPage() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-gray-600">
        O endereço acessado não existe ou foi removido.
      </p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
