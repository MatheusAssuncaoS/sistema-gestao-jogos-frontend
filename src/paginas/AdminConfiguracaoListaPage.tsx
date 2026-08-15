import { Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { adminConfiguracaoService } from '../servicos/adminConfiguracaoService';
import { ApiError } from '../servicos/api';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { Sheet } from '../componentes/ui/Sheet';
import { Confirmacao } from '../componentes/ui/Confirmacao';

type Tipo = 'modalidades' | 'locais' | 'categorias';
type ItemConfiguracao = { id: string | number; nome: string; descricao?: string | null; peso?: number };
const niveisHabilidade: Record<number, string> = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado' };

const configuracao = {
  modalidades: { titulo: 'Modalidades', descricao: 'Gerencie as modalidades disponíveis para criação de partidas.', singular: 'modalidade', carregar: adminConfiguracaoService.listarModalidades },
  locais: { titulo: 'Locais', descricao: 'Gerencie os espaços onde as partidas podem acontecer.', singular: 'local', carregar: adminConfiguracaoService.listarLocais },
  categorias: { titulo: 'Categorias', descricao: 'Gerencie as categorias utilizadas para organizar jogadores e partidas.', singular: 'categoria', carregar: adminConfiguracaoService.listarCategorias },
};

export function AdminConfiguracaoListaPage({ tipo }: { tipo: Tipo }) {
  const dados = configuracao[tipo];
  const [busca, setBusca] = useState('');
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [peso, setPeso] = useState('1');
  const [aviso, setAviso] = useState('');
  const [modalidadeEmEdicao, setModalidadeEmEdicao] = useState<ItemConfiguracao | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [localEmEdicao, setLocalEmEdicao] = useState<ItemConfiguracao | null>(null);
  const [nomeLocalEdicao, setNomeLocalEdicao] = useState('');
  const [descricaoLocalEdicao, setDescricaoLocalEdicao] = useState('');
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<ItemConfiguracao | null>(null);
  const [nomeCategoriaEdicao, setNomeCategoriaEdicao] = useState('');
  const [pesoCategoriaEdicao, setPesoCategoriaEdicao] = useState('1');
  const consulta = useQuery<ItemConfiguracao[]>({ queryKey: ['configuracoes', tipo], queryFn: async () => dados.carregar() });
  const cadastro = useMutation<ItemConfiguracao, Error>({
    mutationFn: async () => tipo === 'modalidades'
      ? await adminConfiguracaoService.criarModalidade(nome.trim())
      : tipo === 'locais'
        ? await adminConfiguracaoService.criarLocal(nome.trim(), descricao.trim() || undefined)
        : await adminConfiguracaoService.criarCategoria(nome.trim(), Number(peso)),
    onSuccess: () => {
      setCadastroAberto(false);
      setNome(''); setDescricao(''); setPeso('1');
      setAviso(`${dados.singular.charAt(0).toUpperCase()}${dados.singular.slice(1)} cadastrado com sucesso.`);
      void consulta.refetch();
    },
  });
  const itens = useMemo(() => (consulta.data ?? []).filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))), [busca, consulta.data]);
  const edicao = useMutation({
    mutationFn: () => adminConfiguracaoService.editarModalidade(String(modalidadeEmEdicao!.id), nomeEdicao.trim()),
    onSuccess: () => {
      setModalidadeEmEdicao(null);
      setAviso('Modalidade atualizada com sucesso.');
      void consulta.refetch();
    },
  });
  const exclusao = useMutation({
    mutationFn: () => adminConfiguracaoService.excluirModalidade(String(modalidadeEmEdicao!.id)),
    onSuccess: () => {
      setModalidadeEmEdicao(null);
      setAviso('Modalidade excluída com sucesso.');
      void consulta.refetch();
    },
  });
  const edicaoLocal = useMutation({
    mutationFn: () => adminConfiguracaoService.editarLocal(String(localEmEdicao!.id), nomeLocalEdicao.trim(), descricaoLocalEdicao.trim() || undefined),
    onSuccess: () => {
      setLocalEmEdicao(null);
      setAviso('Local atualizado com sucesso.');
      void consulta.refetch();
    },
  });
  const exclusaoLocal = useMutation({
    mutationFn: () => adminConfiguracaoService.excluirLocal(String(localEmEdicao!.id)),
    onSuccess: () => {
      setLocalEmEdicao(null);
      setAviso('Local excluído com sucesso.');
      void consulta.refetch();
    },
  });
  const edicaoCategoria = useMutation({
    mutationFn: () => adminConfiguracaoService.editarCategoria(Number(categoriaEmEdicao!.id), nomeCategoriaEdicao.trim(), Number(pesoCategoriaEdicao)),
    onSuccess: () => {
      setCategoriaEmEdicao(null);
      setAviso('Categoria atualizada com sucesso.');
      void consulta.refetch();
    },
  });
  const exclusaoCategoria = useMutation({
    mutationFn: () => adminConfiguracaoService.excluirCategoria(Number(categoriaEmEdicao!.id)),
    onSuccess: () => {
      setCategoriaEmEdicao(null);
      setAviso('Categoria excluída com sucesso.');
      void consulta.refetch();
    },
  });

  return <section className="admin-card admin-users-page" aria-labelledby={`titulo-${tipo}`}>
    <header className="admin-card-header"><div><h1 id={`titulo-${tipo}`}>{dados.titulo}</h1><p>{dados.descricao}</p></div><button type="button" className="admin-button admin-button-primary" onClick={() => { cadastro.reset(); setCadastroAberto(true); }}><Plus aria-hidden="true" />Cadastrar {dados.singular}</button></header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar"><label className="admin-users-search"><span>Buscar</span><div><input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder={`Buscar ${dados.singular}`} /><Search aria-hidden="true" /></div></label></div>
      {consulta.isPending && <div className="admin-table-skeleton" aria-label={`Carregando ${dados.titulo.toLowerCase()}`}><span /><span /><span /></div>}
      {consulta.isError && <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados.</span><button onClick={() => void consulta.refetch()}>Tentar novamente</button></div>}
      {consulta.isSuccess && itens.length === 0 && <div className="admin-empty-state"><h3>Nenhuma {dados.singular} encontrada</h3><p>Os registros cadastrados aparecerão aqui.</p></div>}
      {itens.length > 0 && <div className="admin-users-table-wrap"><table className="admin-users-table admin-config-table"><thead><tr><th>Nome</th>{tipo === 'locais' && <th>Descrição</th>}{tipo === 'categorias' && <th>Nível de habilidade</th>}<th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{itens.map((item) => <tr key={item.id}><td><strong>{item.nome}</strong></td>{tipo === 'locais' && <td>{item.descricao || 'Sem descrição'}</td>}{tipo === 'categorias' && <td>{niveisHabilidade[item.peso ?? 1]}</td>}<td><span className="admin-badge admin-badge-aberta">Ativo</span></td>{tipo === 'modalidades' && <td className="admin-user-action"><button type="button" aria-label={`Editar modalidade ${item.nome}`} onClick={() => { edicao.reset(); exclusao.reset(); setNomeEdicao(item.nome); setModalidadeEmEdicao(item); }}><Pencil aria-hidden="true" /></button></td>}{tipo === 'locais' && <td className="admin-user-action"><button type="button" aria-label={`Editar local ${item.nome}`} onClick={() => { edicaoLocal.reset(); exclusaoLocal.reset(); setNomeLocalEdicao(item.nome); setDescricaoLocalEdicao(item.descricao ?? ''); setLocalEmEdicao(item); }}><Pencil aria-hidden="true" /></button></td>}{tipo === 'categorias' && <td className="admin-user-action"><button type="button" aria-label={`Editar categoria ${item.nome}`} onClick={() => { edicaoCategoria.reset(); exclusaoCategoria.reset(); setNomeCategoriaEdicao(item.nome); setPesoCategoriaEdicao(String(item.peso ?? 1)); setCategoriaEmEdicao(item); }}><Pencil aria-hidden="true" /></button></td>}</tr>)}</tbody></table></div>}
    </div>
    <Sheet aberto={cadastroAberto} aoAlterar={setCadastroAberto} titulo={`Cadastrar ${dados.singular}`} descricao="Informe os dados do novo registro.">
      <form className="admin-sheet-section admin-sheet-form" onSubmit={(evento: FormEvent) => { evento.preventDefault(); cadastro.mutate(); }}>
        <label>Nome <span>Obrigatório</span><input autoFocus required maxLength={tipo === 'categorias' ? 50 : 100} value={nome} onChange={(evento) => setNome(evento.target.value)} placeholder={`Nome da ${dados.singular}`} /></label>
        {tipo === 'locais' && <label>Descrição <span>Opcional; até 255 caracteres</span><textarea maxLength={255} rows={4} value={descricao} onChange={(evento) => setDescricao(evento.target.value)} placeholder="Informações para identificar o espaço" /></label>}
        {tipo === 'categorias' && <label>Nível de habilidade <span>Usado para equilibrar as equipes</span><select required value={peso} onChange={(evento) => setPeso(evento.target.value)}><option value="1">Iniciante</option><option value="2">Intermediário</option><option value="3">Avançado</option></select></label>}
        {cadastro.isError && <p className="admin-sheet-error" role="alert">{cadastro.error instanceof ApiError ? cadastro.error.detail : `Não foi possível cadastrar a ${dados.singular}.`}</p>}
        <div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={cadastro.isPending} onClick={() => setCadastroAberto(false)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={cadastro.isPending || !nome.trim() || (tipo === 'categorias' && (!peso || Number(peso) < 1))}>{cadastro.isPending ? 'Cadastrando…' : 'Cadastrar'}</button></div>
      </form>
    </Sheet>
    <Sheet aberto={categoriaEmEdicao !== null} aoAlterar={(aberto) => { if (!aberto) setCategoriaEmEdicao(null); }} titulo="Editar categoria" descricao="Atualize o nome e o nível utilizado no balanceamento.">
      <form className="admin-sheet-section admin-sheet-form" onSubmit={(evento) => { evento.preventDefault(); edicaoCategoria.mutate(); }}>
        <label>Nome <span>Obrigatório; até 50 caracteres</span><input autoFocus required maxLength={50} value={nomeCategoriaEdicao} onChange={(evento) => setNomeCategoriaEdicao(evento.target.value)} /></label>
        <label>Nível de habilidade <span>Usado para equilibrar as equipes</span><select required value={pesoCategoriaEdicao} onChange={(evento) => setPesoCategoriaEdicao(evento.target.value)}><option value="1">Iniciante</option><option value="2">Intermediário</option><option value="3">Avançado</option></select></label>
        {edicaoCategoria.isError && <p className="admin-sheet-error" role="alert">{edicaoCategoria.error instanceof ApiError ? edicaoCategoria.error.detail : 'Não foi possível atualizar a categoria.'}</p>}
        <div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={edicaoCategoria.isPending || exclusaoCategoria.isPending} onClick={() => setCategoriaEmEdicao(null)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={edicaoCategoria.isPending || exclusaoCategoria.isPending || !nomeCategoriaEdicao.trim() || (nomeCategoriaEdicao.trim() === categoriaEmEdicao?.nome && Number(pesoCategoriaEdicao) === categoriaEmEdicao?.peso)}>{edicaoCategoria.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div>
      </form>
      <div className="admin-danger-zone"><h3>Excluir categoria</h3><p>A categoria será removida permanentemente. Categorias vinculadas a jogadores ou partidas não podem ser excluídas.</p><Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Excluir categoria</button>} titulo="Excluir categoria permanentemente?" descricao={`A categoria ${categoriaEmEdicao?.nome ?? ''} será removida. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={exclusaoCategoria.isPending} aoConfirmar={() => exclusaoCategoria.mutate()} />{exclusaoCategoria.isError && <p className="admin-sheet-error" role="alert">{exclusaoCategoria.error instanceof ApiError ? exclusaoCategoria.error.detail : 'Não foi possível excluir a categoria.'}</p>}</div>
    </Sheet>
    <Sheet aberto={localEmEdicao !== null} aoAlterar={(aberto) => { if (!aberto) setLocalEmEdicao(null); }} titulo="Editar local" descricao="Atualize a identificação e a descrição do espaço.">
      <form className="admin-sheet-section admin-sheet-form" onSubmit={(evento) => { evento.preventDefault(); edicaoLocal.mutate(); }}>
        <label>Nome <span>Obrigatório; até 100 caracteres</span><input autoFocus required maxLength={100} value={nomeLocalEdicao} onChange={(evento) => setNomeLocalEdicao(evento.target.value)} /></label>
        <label>Descrição <span>Opcional; até 255 caracteres</span><textarea maxLength={255} rows={4} value={descricaoLocalEdicao} onChange={(evento) => setDescricaoLocalEdicao(evento.target.value)} /></label>
        {edicaoLocal.isError && <p className="admin-sheet-error" role="alert">{edicaoLocal.error instanceof ApiError ? edicaoLocal.error.detail : 'Não foi possível atualizar o local.'}</p>}
        <div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={edicaoLocal.isPending || exclusaoLocal.isPending} onClick={() => setLocalEmEdicao(null)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={edicaoLocal.isPending || exclusaoLocal.isPending || !nomeLocalEdicao.trim() || (nomeLocalEdicao.trim() === localEmEdicao?.nome && descricaoLocalEdicao.trim() === (localEmEdicao?.descricao ?? ''))}>{edicaoLocal.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div>
      </form>
      <div className="admin-danger-zone"><h3>Excluir local</h3><p>O local será removido permanentemente. Locais vinculados a partidas não podem ser excluídos.</p><Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Excluir local</button>} titulo="Excluir local permanentemente?" descricao={`O local ${localEmEdicao?.nome ?? ''} será removido. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={exclusaoLocal.isPending} aoConfirmar={() => exclusaoLocal.mutate()} />{exclusaoLocal.isError && <p className="admin-sheet-error" role="alert">{exclusaoLocal.error instanceof ApiError ? exclusaoLocal.error.detail : 'Não foi possível excluir o local.'}</p>}</div>
    </Sheet>
    <Sheet aberto={modalidadeEmEdicao !== null} aoAlterar={(aberto) => { if (!aberto) setModalidadeEmEdicao(null); }} titulo="Editar modalidade" descricao="Atualize o nome utilizado nas partidas.">
      <form className="admin-sheet-section admin-sheet-form" onSubmit={(evento) => { evento.preventDefault(); edicao.mutate(); }}>
        <label>Nome <span>Obrigatório; até 100 caracteres</span><input autoFocus required maxLength={100} value={nomeEdicao} onChange={(evento) => setNomeEdicao(evento.target.value)} /></label>
        {edicao.isError && <p className="admin-sheet-error" role="alert">{edicao.error instanceof ApiError ? edicao.error.detail : 'Não foi possível atualizar a modalidade.'}</p>}
        <div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={edicao.isPending || exclusao.isPending} onClick={() => setModalidadeEmEdicao(null)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={edicao.isPending || exclusao.isPending || !nomeEdicao.trim() || nomeEdicao.trim() === modalidadeEmEdicao?.nome}>{edicao.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div>
      </form>
      <div className="admin-danger-zone"><h3>Excluir modalidade</h3><p>A modalidade será removida permanentemente. Modalidades vinculadas a partidas não podem ser excluídas.</p><Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Excluir modalidade</button>} titulo="Excluir modalidade permanentemente?" descricao={`A modalidade ${modalidadeEmEdicao?.nome ?? ''} será removida. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={exclusao.isPending} aoConfirmar={() => exclusao.mutate()} />{exclusao.isError && <p className="admin-sheet-error" role="alert">{exclusao.error instanceof ApiError ? exclusao.error.detail : 'Não foi possível excluir a modalidade.'}</p>}</div>
    </Sheet>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
  </section>;
}
