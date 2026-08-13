import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import type { StatusUsuario, UsuarioResumo } from '../servicos/tipos';

const rotulosStatus: Record<StatusUsuario, string> = {
  PENDENTE: 'Pendente',
  ATIVO: 'Ativo',
  BLOQUEADO: 'Bloqueado',
  INATIVO: 'Inativo',
  RECUSADO: 'Recusado',
};

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError
    ? falha.detail
    : 'Não foi possível completar a operação. Tente novamente.';
}

export function GestaoDeOrganizadores() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const usuarios = useQuery({
    queryKey: ['admin', 'usuarios'],
    queryFn: adminUsuarioService.listar,
  });

  const alterarPapel = useMutation({
    mutationFn: ({ usuario, conceder }: { usuario: UsuarioResumo; conceder: boolean }) =>
      conceder
        ? adminUsuarioService.concederOrganizador(usuario.id)
        : adminUsuarioService.revogarOrganizador(usuario.id),
    onSuccess: (atualizado, variaveis) => {
      queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) =>
        lista.map((usuario) => usuario.id === atualizado.id ? atualizado : usuario)
      );
      setAviso(
        variaveis.conceder
          ? `${atualizado.nome} agora é organizador. A alteração valerá no próximo login.`
          : `O papel de organizador foi removido de ${atualizado.nome}.`
      );
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return usuarios.data ?? [];
    return (usuarios.data ?? []).filter((usuario) =>
      usuario.nome.toLocaleLowerCase('pt-BR').includes(termo)
      || usuario.email.toLocaleLowerCase('pt-BR').includes(termo)
    );
  }, [busca, usuarios.data]);

  function revogar(usuario: UsuarioResumo) {
    if (window.confirm(`Remover o papel de organizador de ${usuario.nome}?`)) {
      setAviso(null);
      alterarPapel.mutate({ usuario, conceder: false });
    }
  }

  return (
    <section id="organizadores" className="admin-card" aria-labelledby="titulo-organizadores">
      <header className="admin-card-header">
        <div>
          <h2 id="titulo-organizadores">Gestão de organizadores</h2>
          <p>Conceda ou remova o acesso à gestão de partidas.</p>
        </div>
        <button
          type="button"
          onClick={() => usuarios.refetch()}
          disabled={usuarios.isFetching}
          className="admin-button admin-button-secondary"
        >
          <span aria-hidden="true">↻</span> Atualizar
        </button>
      </header>

      <input
        type="search"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar por nome ou e-mail"
        aria-label="Buscar usuários"
        className="admin-search admin-search-spaced"
      />

      <p role="status" aria-live="polite" className="min-h-5 text-sm text-green-700">
        {aviso}
      </p>

      {alterarPapel.isError && (
        <p role="alert" className="text-sm text-red-700">{mensagemDeErro(alterarPapel.error)}</p>
      )}
      {usuarios.isPending && <p className="text-gray-600">Carregando usuários...</p>}
      {usuarios.isError && (
        <p role="alert" className="text-sm text-red-700">
          {mensagemDeErro(usuarios.error)}{' '}
          <button type="button" onClick={() => usuarios.refetch()} className="font-semibold underline">
            Tentar novamente
          </button>
        </p>
      )}
      {usuarios.isSuccess && filtrados.length === 0 && (
        <p className="text-gray-600">
          {busca.trim() ? 'Nenhuma conta encontrada.' : 'Nenhuma conta cadastrada.'}
        </p>
      )}

      {filtrados.length > 0 && (
        <ul className="admin-record-list">
          {filtrados.map((usuario) => {
            const organizador = usuario.papeis.includes('ORGANIZADOR');
            const bloqueado = usuario.status === 'BLOQUEADO' || usuario.status === 'INATIVO';
            const emAndamento = alterarPapel.isPending && alterarPapel.variables.usuario.id === usuario.id;

            return (
              <li key={usuario.id} className="admin-record">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <strong>{usuario.nome}</strong>
                    <div className="text-sm">{usuario.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`admin-badge ${usuario.status === 'ATIVO' ? 'admin-badge-finalizada' : ''}`}>
                        {rotulosStatus[usuario.status]}
                      </span>
                      {usuario.papeis.map((papel) => <span key={papel} className="admin-badge">{papel}</span>)}
                    </div>
                  </div>

                  {organizador ? (
                    <button
                      type="button"
                      onClick={() => revogar(usuario)}
                      disabled={alterarPapel.isPending}
                      className="admin-button admin-button-danger"
                    >
                      {emAndamento ? 'Removendo...' : 'Remover organizador'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAviso(null); alterarPapel.mutate({ usuario, conceder: true }); }}
                      disabled={alterarPapel.isPending || bloqueado}
                      title={bloqueado ? 'Contas bloqueadas ou inativas não podem receber papéis.' : undefined}
                      className="admin-button admin-button-primary"
                    >
                      {emAndamento ? 'Concedendo...' : 'Tornar organizador'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
