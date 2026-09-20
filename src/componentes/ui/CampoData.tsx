import './CampoData.css';
import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface CampoDataProps {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  min?: string;
  max?: string;
  autoFocus?: boolean;
}

function dataCivil(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function CampoData({ titulo, valor, aoAlterar, min, max, autoFocus }: CampoDataProps) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [rascunho, setRascunho] = useState({ valor, texto: valor.split('-').reverse().join('/') });
  const texto = rascunho.valor === valor ? rascunho.texto : valor.split('-').reverse().join('/');
  useEffect(() => {
    const invalido = (texto && !valor) || (valor && ((min && valor < min) || (max && valor > max)));
    campo.current?.setCustomValidity(invalido ? 'Informe uma data válida dentro do período permitido.' : '');
  }, [texto, valor, min, max]);
  function selecionar(data: string) {
    setRascunho({ valor: data, texto: data.split('-').reverse().join('/') });
    aoAlterar(data);
    setAberto(false);
    campo.current?.focus();
  }
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(() => new Date());
  const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const quantidade = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  function abrir() {
    if (!aberto) setMes(new Date(`${valor || min || dataCivil(new Date())}T12:00:00`));
    setAberto(true);
  }
  return <div className="admin-date-field" onBlur={e => {
    if (!e.currentTarget.contains(e.relatedTarget)) setAberto(false);
  }} onKeyDown={e => {
    if (e.key === 'Escape') { setAberto(false); campo.current?.focus(); }
  }}>
    <label htmlFor={id}>{titulo}</label>
    <div className="admin-date-input">
      <input ref={campo} id={id} type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10} autoFocus={autoFocus} value={texto}
        aria-expanded={aberto} aria-controls={`${id}-calendario`}
        onClick={abrir} onKeyDown={e => { if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); abrir(); } }}
        onChange={e => {
          const numeros = e.target.value.replace(/\D/g, '').slice(0, 8);
          const digitado = [numeros.slice(0, 2), numeros.slice(2, 4), numeros.slice(4, 8)].filter(Boolean).join('/');
          const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(digitado);
          const iso = partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : '';
          const data = new Date(`${iso}T12:00:00`);
          const valido = iso && Number.isFinite(data.getTime()) && dataCivil(data) === iso;
          const novoValor = valido ? iso : '';
          setRascunho({ valor: novoValor, texto: digitado });
          aoAlterar(novoValor);
          if (valido) setMes(data);
        }}/>
      <button type="button" aria-label={`Abrir calendário: ${titulo}`} onClick={abrir}><CalendarDays size={18}/></button>
    </div>
    {aberto && <div id={`${id}-calendario`} className="admin-date-calendar" role="group" aria-label={`Calendário: ${titulo}`}>
      <div className="admin-date-month">
        <button type="button" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}><ChevronLeft size={18}/></button>
        <strong aria-live="polite">{primeiro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}><ChevronRight size={18}/></button>
      </div>
      <div className="admin-date-days">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => <span key={dia}>{dia}</span>)}
        {Array.from({ length: primeiro.getDay() }, (_, i) => <span key={`vazio-${i}`}/>)}
        {Array.from({ length: quantidade }, (_, i) => {
          const data = new Date(mes.getFullYear(), mes.getMonth(), i + 1);
          const iso = dataCivil(data);
          return <button type="button" key={iso} disabled={Boolean((min && iso < min) || (max && iso > max))}
            aria-label={data.toLocaleDateString('pt-BR', { dateStyle: 'full' })} aria-pressed={valor === iso}
            onClick={() => selecionar(iso)}>{i + 1}</button>;
        })}
      </div>
      <button type="button" className="admin-date-clear" onClick={() => selecionar('')}>Limpar</button>
    </div>}
  </div>;
}
