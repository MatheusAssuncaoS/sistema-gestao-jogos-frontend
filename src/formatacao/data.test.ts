import { describe, expect, it } from 'vitest';

import { formatarDataHora } from './data';

describe('formatarDataHora', () => {
  it('devolve uma mensagem segura quando a API envia uma data inválida', () => {
    expect(formatarDataHora('valor-invalido')).toBe('Data não informada');
  });

  it('formata data e horário no padrão brasileiro', () => {
    const resultado = formatarDataHora('2026-08-13T18:30:00-03:00');
    expect(resultado).toContain('2026');
    expect(resultado).toContain('18:30');
  });
});
