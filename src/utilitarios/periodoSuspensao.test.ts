import { describe, expect, it } from 'vitest';
import { fimDoPeriodo } from './periodoSuspensao';

describe('período inclusivo de suspensão', () => {
  it('mantém um dia na data inicial', () => expect(fimDoPeriodo('2026-09-24', 1)).toBe('2026-09-24'));
  it('atravessa meses e anos', () => expect(fimDoPeriodo('2026-12-29', 5)).toBe('2027-01-02'));
  it('inclui o dia bissexto', () => expect(fimDoPeriodo('2028-02-28', 15)).toBe('2028-03-13'));
  it('permite limpar a data inicial', () => expect(fimDoPeriodo('', 5)).toBe(''));
});
