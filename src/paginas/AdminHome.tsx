import { CadastrosPendentes } from '../componentes/CadastrosPendentes';

export function AdminHome() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Área do administrador</h1>
      <p className="mt-2 text-gray-600">
        Aqui vão a gestão de organizadores e a configuração do calendário do
        clube.
      </p>

      <CadastrosPendentes />
    </div>
  );
}
