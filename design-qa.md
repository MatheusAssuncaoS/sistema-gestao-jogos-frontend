# Design QA — calendário de partidas

- Source visual truth: `https://paceui.com/preview/templates/ultimate-dashboard/apps/calendar` and `/tmp/codex-clipboard-04d5de25-1e30-4475-8873-a55f85b32051.png`
- Implementation: `http://localhost:5173/admin/partidas/calendario`
- Browser evidence: Codex in-app browser capture of the month, week, and day states at a 1264 × 710 viewport.
- Density: browser CSS pixels at device scale 1; source and implementation were compared by their content regions rather than browser chrome.
- State: September 2026, with September 21 selected and realistic ClubeOne matches.

## Full-view comparison evidence

The implementation preserves the source composition: compact month navigation in a left rail, period navigation and view controls in the main header, and a larger calendar surface on the right. It deliberately retains ClubeOne typography, neutral tokens, button styling, status colors, and match-card content instead of copying PaceUI branding.

## Focused region comparison evidence

The mini calendar, view switcher, and event cells were inspected at readable scale. The mini calendar shows selected-day and event-dot states; the view switcher exposes Dia, Semana, and Mês; event cards retain time, modality, location, enrollment, and click behavior where space allows.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Typography: DM Sans hierarchy and compact control weights remain consistent with ClubeOne.
- Spacing: the left rail and main calendar align in one bordered workspace with consistent dividers.
- Colors: existing neutral and green semantic tokens are preserved.
- Assets: the interface uses the project's existing Lucide icon set; no raster imagery is required by this screen.
- Copy: labels are localized to Portuguese and match the product terminology.

## Interaction checks

- Selecting a date in the mini calendar updates the active period.
- Dia, Semana, and Mês switch correctly.
- Previous and next controls move by the active view's period.
- Match cards remain selectable and route to match details.
- Empty dates show an explicit empty state.

## Comparison history

- Initial pass: selected date was outside the fixture's event week, making the weekly view appear empty.
- Verification pass: selected September 21 in the mini calendar and confirmed populated week and day views. No layout fix was required.

## Follow-up polish

- P3: a future iteration could add per-location visibility filters if the calendar becomes dense.

final result: passed

## 2026-09-20 — Listagem de usuários / referência Pace UI

- Fonte visual: https://paceui.com/preview/templates/ultimate-dashboard/apps/users, capturada no navegador integrado (aba 1).
- Implementação: http://localhost:5173/admin/seguranca/usuarios, capturada autenticada no navegador integrado (aba 2).
- Evidências: capturas incorporadas à conversa na chamada “Comparar versão final em desktop”; referência e implementação retornadas juntas. Não foram exportados arquivos de imagem locais.
- Desktop: viewport de 1440 × 1000 CSS px; capturas exibidas em aproximadamente 1440 × 1000 px, sem normalização adicional. Mobile: viewport 390 × 844 CSS px; captura incorporada em “Concluir verificação responsiva”.
- Estado: primeira página, sem filtros, dez registros reais. A referência usa dados demonstrativos diferentes.
- Tipografia: preservada a fonte do produto; nome em destaque e e-mail secundário, com hierarquia semelhante à referência.
- Layout: filtros externos à tabela, borda fina, cabeçalho neutro, avatares circulares, ações por reticências. A paginação e o painel de edição existentes foram preservados.
- Cores: fundo branco, bordas neutras, badge preto de Ativo conforme pedido anterior.
- Assets: iniciais das contas substituem fotos porque o produto não possui fotos de usuários; ícones da biblioteca existente.
- Conteúdo: português e dados reais; omitidas colunas sem dados correspondentes no sistema (departamento, último login).
- Comparação inicial: densidade das linhas maior que a referência; altura e padding reduzidos. Botão de cadastro quebrava em duas linhas no mobile; corrigido com largura automática e texto sem quebra. Captura posterior confirmou a correção.
- Responsividade: filtros se reorganizam e tabela mantém rolagem horizontal; nome/e-mail preservados mesmo com regras globais que escondiam a segunda coluna.
- Interações verificadas: busca por Árbitro Teste retorna um usuário; filtro Árbitro retorna dois; limpar restaura 22; reticências abrem painel de gestão e fechamento retorna à lista.
- Limites: console não inspecionado nesta rodada; operações de alteração de contas não executadas durante a revisão visual.
- Sem problemas P0/P1/P2 restantes na adaptação solicitada. Diferenças de fonte, dados, sidebar e paginação são intencionais para preservar o produto.
- final result: passed
