import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../contexto/useAuth';
import { pode } from '../../seguranca/permissoes';
import { adminUsuarioService } from '../../servicos/adminUsuarioService';
import { perfilAcessoService } from '../../servicos/perfilAcessoService';
import { ApiError } from '../../servicos/api';
import type { UsuarioResumo } from '../../servicos/tipos';
import '../../paginas/PerfisAcesso.css';

export function PerfisDoUsuario({ usuario, aoSalvar }: { usuario: UsuarioResumo; aoSalvar: (usuario: UsuarioResumo) => void }) {
  const { usuario: operador } = useAuth();
  const client = useQueryClient();
  const consulta = useQuery({ queryKey: ['admin', 'perfis'], queryFn: perfilAcessoService.listar });
  const [ids, setIds] = useState<number[]>(usuario.perfis?.filter(p => p.codigo !== 'JOGADOR').map(p => p.id) ?? []);
  const editavel = pode(operador, 'USUARIOS_ACESSOS') && operador?.id !== usuario.id;
  const salvar = useMutation({
    mutationFn: () => adminUsuarioService.vincularPerfis(usuario.id, ids, usuario.versao),
    onSuccess: async atualizado => { aoSalvar(atualizado); await client.invalidateQueries({ queryKey: ['admin'] }); },
  });
  const anteriores = usuario.perfis?.filter(p => p.codigo !== 'JOGADOR').map(p => p.id) ?? [];
  const alterado = ids.length !== anteriores.length || ids.some(id => !anteriores.includes(id));
  if (consulta.isPending) return <p role="status">Carregando perfis…</p>;
  if (consulta.isError) return <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os perfis.</span><button onClick={() => void consulta.refetch()}>Tentar novamente</button></div>;
  return <div className="perfil-user-options">
    {consulta.data.filter(p => p.codigo !== 'JOGADOR' && (p.ativo || ids.includes(p.id))).map(perfil => <label key={perfil.id}><input type="checkbox" checked={ids.includes(perfil.id)} disabled={!editavel || salvar.isPending || (!perfil.ativo && !ids.includes(perfil.id))} onChange={e => setIds(e.target.checked ? [...ids, perfil.id] : ids.filter(id => id !== perfil.id))} /><span><strong>{perfil.nome}{!perfil.ativo && ' (inativo)'}</strong><small>{perfil.descricao}</small></span></label>)}
    {operador?.id === usuario.id && <p>Os próprios perfis só podem ser alterados por outro responsável autorizado.</p>}
    {usuario.perfis?.some(p => p.codigo === 'JOGADOR') && <p>O acesso de jogador é preservado e continua vinculado à aprovação do associado.</p>}
    {editavel && <button type="button" className="admin-button admin-button-secondary" disabled={!ids.length || !alterado || salvar.isPending} onClick={() => salvar.mutate()}>{salvar.isPending ? 'Salvando…' : 'Salvar perfis'}</button>}
    {salvar.isError && <p role="alert" className="admin-form-error">{salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível atualizar os perfis.'}</p>}
  </div>;
}
