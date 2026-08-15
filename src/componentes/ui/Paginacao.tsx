type PaginacaoProps = {
  total: number;
  rotuloSingular: string;
  rotuloPlural: string;
  pagina: number;
  totalPaginas: number;
  itensPorPagina: number;
  aoMudarPagina: (pagina: number) => void;
  aoMudarItensPorPagina: (quantidade: number) => void;
};

export function Paginacao({ total, rotuloSingular, rotuloPlural, pagina, totalPaginas, itensPorPagina, aoMudarPagina, aoMudarItensPorPagina }: PaginacaoProps) {
  return <nav className="admin-pagination" aria-label={`Paginação de ${rotuloPlural}`}><div className="admin-pagination-summary"><span>{total} {total === 1 ? rotuloSingular : rotuloPlural}</span><label>Mostrar<select value={itensPorPagina} onChange={(evento) => aoMudarItensPorPagina(Number(evento.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select>por página</label></div><div className="admin-pagination-navigation"><button className="admin-button admin-button-secondary" disabled={pagina === 1} onClick={() => aoMudarPagina(pagina - 1)}>Anterior</button><label>Página<select value={pagina} onChange={(evento) => aoMudarPagina(Number(evento.target.value))}>{Array.from({ length: totalPaginas }, (_, indice) => <option value={indice + 1} key={indice + 1}>{indice + 1}</option>)}</select><span>de {totalPaginas}</span></label><button className="admin-button admin-button-secondary" disabled={pagina === totalPaginas} onClick={() => aoMudarPagina(pagina + 1)}>Próxima</button></div></nav>;
}
