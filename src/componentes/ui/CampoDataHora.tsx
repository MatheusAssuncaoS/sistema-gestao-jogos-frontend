import './CampoData.css';
import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface CampoDataHoraProps {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  min?: string;
  descricao?: string;
}

function dataCivil(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function textoDoValor(valor: string) {
  if (!valor) return '';
  const [data, hora = ''] = valor.split('T');
  return `${data.split('-').reverse().join('/')} ${hora.slice(0, 5)}`.trim();
}

export function CampoDataHora({ titulo, valor, aoAlterar, min, descricao }: CampoDataHoraProps) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(() => new Date());
  const [rascunho, setRascunho] = useState({ valor, texto: textoDoValor(valor) });
  const texto = rascunho.valor === valor ? rascunho.texto : textoDoValor(valor);
  const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const quantidade = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const horaAtual = valor.split('T')[1]?.slice(0, 5) || '00:00';

  useEffect(() => {
    const invalido = (texto && !valor) || Boolean(valor && min && valor < min);
    campo.current?.setCustomValidity(invalido ? 'Informe uma data e hora válidas.' : '');
  }, [texto, valor, min]);

  function abrir() {
    const referencia = valor.split('T')[0] || min?.split('T')[0] || dataCivil(new Date());
    if (!aberto) setMes(new Date(`${referencia}T12:00:00`));
    setAberto(true);
  }

  function alterar(valorNovo: string) {
    setRascunho({ valor: valorNovo, texto: textoDoValor(valorNovo) });
    aoAlterar(valorNovo);
  }

  function selecionarData(data: string) {
    alterar(`${data}T${horaAtual}`);
  }

  return <div className="admin-date-field" onBlur={evento => {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setAberto(false);
  }} onKeyDown={evento => {
    if (evento.key === 'Escape') { setAberto(false); campo.current?.focus(); }
  }}>
    <label htmlFor={id}>{titulo}</label>
    <div className="admin-date-input">
      <input ref={campo} id={id} type="text" inputMode="numeric" placeholder="dd/mm/aaaa, --:--" maxLength={16}
        value={texto} aria-expanded={aberto} aria-controls={`${id}-calendario`} onClick={abrir}
        onKeyDown={evento => { if (evento.key === 'ArrowDown' && evento.altKey) { evento.preventDefault(); abrir(); } }}
        onChange={evento => {
          const numeros = evento.target.value.replace(/\D/g, '').slice(0, 12);
          const digitado = `${[numeros.slice(0, 2), numeros.slice(2, 4), numeros.slice(4, 8)].filter(Boolean).join('/')}${numeros.length > 8 ? ` ${numeros.slice(8, 10)}${numeros.length > 10 ? `:${numeros.slice(10, 12)}` : ''}` : ''}`;
          const partes = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(digitado);
          const iso = partes ? `${partes[3]}-${partes[2]}-${partes[1]}T${partes[4]}:${partes[5]}` : '';
          const data = partes ? new Date(`${partes[3]}-${partes[2]}-${partes[1]}T12:00:00`) : new Date(Number.NaN);
          const valido = Boolean(partes && dataCivil(data) === iso.slice(0, 10) && Number(partes[4]) < 24 && Number(partes[5]) < 60);
          const valorNovo = valido ? iso : '';
          setRascunho({ valor: valorNovo, texto: digitado });
          aoAlterar(valorNovo);
          if (valido) setMes(data);
        }}/>
      <button type="button" aria-label={`Abrir calendário: ${titulo}`} onClick={abrir}><CalendarDays size={18}/></button>
    </div>
    {descricao && <span className="admin-date-help">{descricao}</span>}
    {aberto && <div id={`${id}-calendario`} className="admin-date-calendar admin-datetime-calendar" role="group" aria-label={`Calendário: ${titulo}`}>
      <div className="admin-date-month">
        <button type="button" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}><ChevronLeft size={18}/></button>
        <strong aria-live="polite">{primeiro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}><ChevronRight size={18}/></button>
      </div>
      <div className="admin-date-days">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => <span key={dia}>{dia}</span>)}
        {Array.from({ length: primeiro.getDay() }, (_, indice) => <span key={`vazio-${indice}`}/>)}
        {Array.from({ length: quantidade }, (_, indice) => {
          const data = new Date(mes.getFullYear(), mes.getMonth(), indice + 1);
          const iso = dataCivil(data);
          const limite = min?.split('T')[0];
          return <button type="button" key={iso} disabled={Boolean(limite && iso < limite)}
            aria-label={data.toLocaleDateString('pt-BR', { dateStyle: 'full' })} aria-pressed={valor.startsWith(iso)}
            onClick={() => selecionarData(iso)}>{indice + 1}</button>;
        })}
      </div>
      <label className="admin-date-time">Horário<input type="time" value={horaAtual} onChange={evento => {
        const data = valor.split('T')[0] || dataCivil(mes);
        alterar(`${data}T${evento.target.value}`);
      }}/></label>
      <div className="admin-date-calendar-actions"><button type="button" className="admin-date-clear" onClick={() => { alterar(''); setAberto(false); campo.current?.focus(); }}>Limpar</button><button type="button" className="admin-date-confirm" onClick={() => { setAberto(false); campo.current?.focus(); }}>Concluir</button></div>
    </div>}
  </div>;
}
