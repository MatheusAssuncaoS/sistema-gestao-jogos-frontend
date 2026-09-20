import { describe, expect, it } from 'vitest';
import { gerarDatasPartidas, gerarDatasPorDia, conflitosNoLote, diasDaSemanaNoPeriodo } from './gerarDatasPartidas';

describe('dias e horários definidos na partida', () => {
  it('permite terça e domingo em horário livre, com limites inclusivos', () => {
    expect(gerarDatasPartidas('2026-09-13', '2026-09-15', '03:17', ['SUNDAY', 'TUESDAY'], 0)).toEqual([
      '2026-09-13T03:17:00-03:00', '2026-09-15T03:17:00-03:00',
    ]);
  });
  it('atravessa o ano e usa o horário do clube', () => {
    expect(gerarDatasPartidas('2026-12-31', '2027-01-01', '23:45', ['THURSDAY', 'FRIDAY'], 0)).toEqual([
      '2026-12-31T23:45:00-03:00', '2027-01-01T23:45:00-03:00',
    ]);
  });
  it('exclui instantes passados, incluindo o instante atual', () => {
    expect(gerarDatasPartidas('2026-09-13', '2026-09-15', '03:17', ['SUNDAY', 'TUESDAY'], Date.parse('2026-09-13T06:17:00Z'))).toEqual(['2026-09-15T03:17:00-03:00']);
  });
  it('não gera lotes sem seleção ou com período/horário inválido', () => {
    expect(gerarDatasPartidas('2026-09-15', '2026-09-13', '19:00', ['TUESDAY'], 0)).toEqual([]);
    expect(gerarDatasPartidas('2026-09-13', '2030-09-13', '19:00', ['TUESDAY'], 0)).toEqual([]);
    expect(gerarDatasPartidas('2026-09-13', '2026-09-15', '25:00', ['TUESDAY'], 0)).toEqual([]);
    expect(gerarDatasPartidas('2026-09-13', '2026-09-15', '19:00', [], 0)).toEqual([]);
  });
});

describe('horários diferentes por dia da semana', () => {
  it('gera segunda às 7, 8 e 9; terça às 7 e 8; quarta às 8', () => {
    expect(gerarDatasPorDia('2026-09-14', '2026-09-16', {
      MONDAY: ['07:00', '08:00', '09:00'], TUESDAY: ['07:00', '08:00'], WEDNESDAY: ['08:00'],
    }, 0)).toEqual([
      '2026-09-14T07:00:00-03:00', '2026-09-14T08:00:00-03:00', '2026-09-14T09:00:00-03:00',
      '2026-09-15T07:00:00-03:00', '2026-09-15T08:00:00-03:00', '2026-09-16T08:00:00-03:00',
    ]);
  });
  it('ordena horários, elimina duplicatas e repete na semana seguinte', () => {
    expect(gerarDatasPorDia('2026-09-14', '2026-09-21', { MONDAY: ['08:00', '07:00', '07:00'] }, 0)).toEqual([
      '2026-09-14T07:00:00-03:00', '2026-09-14T08:00:00-03:00',
      '2026-09-21T07:00:00-03:00', '2026-09-21T08:00:00-03:00',
    ]);
  });
  it('aceita horários adjacentes e detecta sobreposição inclusive entre dias', () => {
    const datas = ['2026-09-14T23:30:00-03:00', '2026-09-15T00:30:00-03:00'];
    expect(conflitosNoLote(datas, 60).size).toBe(0);
    expect([...conflitosNoLote(datas, 90)]).toEqual(datas);
  });
});


describe('dias da semana presentes no período', () => {
  it('mostra apenas segunda-feira para 21/09/2026', () => {
    expect(diasDaSemanaNoPeriodo('2026-09-21', '2026-09-21')).toEqual(['MONDAY']);
  });
  it('inclui os dois extremos do intervalo', () => {
    expect(diasDaSemanaNoPeriodo('2026-09-21', '2026-09-23')).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY']);
  });
  it('atravessa domingo e mantém a ordem de segunda a domingo', () => {
    expect(diasDaSemanaNoPeriodo('2026-09-26', '2026-09-28')).toEqual(['MONDAY', 'SATURDAY', 'SUNDAY']);
  });
  it('mostra os sete dias sem repetir em períodos maiores', () => {
    const semana = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    expect(diasDaSemanaNoPeriodo('2026-09-21', '2026-09-27')).toEqual(semana);
    expect(diasDaSemanaNoPeriodo('2026-09-21', '2027-09-21')).toEqual(semana);
  });
  it('atravessa meses e anos', () => {
    expect(diasDaSemanaNoPeriodo('2026-09-30', '2026-10-01')).toEqual(['WEDNESDAY', 'THURSDAY']);
    expect(diasDaSemanaNoPeriodo('2026-12-31', '2027-01-01')).toEqual(['THURSDAY', 'FRIDAY']);
  });
  it('não mostra dias para datas incompletas, inexistentes ou invertidas', () => {
    for (const [inicio, fim] of [['', '2026-09-21'], ['2026-09-21', ''], ['2026-09-22', '2026-09-21'], ['2026-02-30', '2026-03-02'], ['inválida', '2026-09-21']]) {
      expect(diasDaSemanaNoPeriodo(inicio, fim)).toEqual([]);
    }
  });
});
