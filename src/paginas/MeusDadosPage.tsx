import { useState, type FormEvent } from 'react';

import { useAuth } from '../contexto/useAuth';
import { ApiError } from '../servicos/api';
import { usuarioService } from '../servicos/usuarioService';
import { validarEmail } from '../validacao/cadastro';

export function MeusDadosPage() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) novosErros.nome = 'Informe seu nome.';
    if (nome.trim().length > 150) novosErros.nome = 'O nome deve ter no máximo 150 caracteres.';
    const erroEmail = validarEmail(email.trim());
    if (erroEmail) novosErros.email = erroEmail;
    if (email.trim().length > 200) novosErros.email = 'O e-mail deve ter no máximo 200 caracteres.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    setSalvo(false);
    setErroGeral(null);
    try {
      const atualizado = await usuarioService.atualizarMeusDados({
        nome: nome.trim(),
        email: email.trim(),
      });
      atualizarUsuario(atualizado);
      setNome(atualizado.nome);
      setEmail(atualizado.email);
      setSalvo(true);
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) {
        setErros(falha.campos);
      } else {
        setErroGeral(falha instanceof ApiError ? falha.detail : 'Não foi possível atualizar seus dados.');
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="max-w-xl" aria-labelledby="titulo-dados">
      <h1 id="titulo-dados" className="text-2xl font-bold">Meus dados</h1>
      <p className="mt-2 text-gray-600">Atualize as informações usadas na sua conta.</p>

      <form onSubmit={submeter} noValidate className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Nome completo</span>
          <input
            value={nome}
            onChange={(evento) => { setNome(evento.target.value); setSalvo(false); }}
            autoComplete="name"
            aria-invalid={erros.nome ? 'true' : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 ${erros.nome ? 'border-red-500' : 'border-gray-300'}`}
          />
          {erros.nome && <span className="mt-1 block text-xs text-red-600">{erros.nome}</span>}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(evento) => { setEmail(evento.target.value); setSalvo(false); }}
            autoComplete="email"
            aria-invalid={erros.email ? 'true' : undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 ${erros.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {erros.email && <span className="mt-1 block text-xs text-red-600">{erros.email}</span>}
        </label>

        {erroGeral && <p role="alert" className="text-sm text-red-700">{erroGeral}</p>}
        {salvo && <p role="status" className="text-sm text-green-700">Dados atualizados com sucesso.</p>}

        <button
          type="submit"
          disabled={salvando || (nome.trim() === usuario?.nome && email.trim() === usuario?.email)}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </section>
  );
}
