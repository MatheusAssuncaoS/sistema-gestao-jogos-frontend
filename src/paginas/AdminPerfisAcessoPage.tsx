import { Search } from 'lucide-react';
import { useState } from 'react';
import type { Papel } from '../servicos/tipos';

const perfis: { codigo: Papel; nome: string; descricao: string }[] = [
  { codigo: 'ADMINISTRADOR', nome: 'Administrador', descricao: 'Administração do sistema, cadastros e usuários.' },
  { codigo: 'ORGANIZADOR', nome: 'Organizador', descricao: 'Organização e gestão de partidas.' },
  { codigo: 'ARBITRO', nome: 'Árbitro', descricao: 'Arbitragem e acompanhamento das partidas.' },
  { codigo: 'JOGADOR', nome: 'Jogador', descricao: 'Consulta de partidas e acompanhamento das próprias inscrições.' },
];

export function AdminPerfisAcessoPage() {
  const [busca, setBusca] = useState('');
  const filtrados = perfis.filter(perfil => `${perfil.nome} ${perfil.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));

  return <section className="admin-card admin-users-page" aria-labelledby="titulo-perfis-acesso">
    <header className="admin-card-header"><div><h1 id="titulo-perfis-acesso">Perfil de Acesso</h1><p>Consulte os perfis de acesso definidos pelo sistema.</p></div></header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar perfil de acesso</span><div><Search /><input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder="Buscar perfil de acesso..." /></div></label></div>
      <div className="admin-filter-feedback" role="status"><span>{filtrados.length} {filtrados.length === 1 ? 'registro encontrado' : 'registros encontrados'}</span>{busca && <b>Filtro aplicado</b>}</div>
      {filtrados.length > 0 ? <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>Perfil</th><th>Descrição</th></tr></thead><tbody>{filtrados.map(perfil => <tr key={perfil.codigo}><td><strong>{perfil.nome}</strong></td><td>{perfil.descricao}</td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><h3>Nenhum perfil encontrado</h3><p>Ajuste a busca para encontrar um perfil de acesso.</p></div>}
    </div>
  </section>;
}
