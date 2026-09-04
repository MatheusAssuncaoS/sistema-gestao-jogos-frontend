# Design QA — padronização de todas as tabelas

## Evidências

- Source visual truth: `/tmp/codex-clipboard-51c82767-efa8-4288-8b20-b0e570b2557f.png` (`148 x 267`, 1x).
- Estado anterior: `/tmp/codex-clipboard-6d74ea28-afad-44b6-b34d-fbf7153312f0.png` (`148 x 267`, 1x).
- Usuários: `/tmp/clubeone-table-users-status-final.jpg` (`1175 x 914`, 1x).
- Categorias: `/tmp/clubeone-table-categories-status-final.jpg` (`1190 x 926`, 1x).
- Agendas: `/tmp/clubeone-table-schedules-status-fixed.jpg` (`1190 x 926`, 1x).
- Partidas: `/tmp/clubeone-table-matches-status-final.jpg`.
- Solicitações: `/tmp/clubeone-table-registrations-status-final.jpg`.
- Dashboard: `/tmp/clubeone-dashboard-table-status-final.jpg`.
- Estado: administrador autenticado, tema claro.

## Normalização e comparação

As referências são recortes focados da coluna Status; as implementações são capturas completas. A comparação conjunta considerou as regiões equivalentes de status, linhas e ações. Usuários, categorias e agendas tinham dados renderizados. Partidas e solicitações estavam vazias no backend atual, portanto seus estados foram validados pela implementação compartilhada, build e empty states renderizados.

## Resultado visual

- Todas as cinco tabelas administrativas usam o mesmo componente `StatusBadge`.
- A tabela resumida de próximas partidas do dashboard também usa o padrão.
- Pills têm altura de 20 px, largura ajustada ao conteúdo, ícone de 11 px, gap de 4 px e tipografia de 10 px.
- Ações de usuários, solicitações e partidas deixaram de usar o caractere `›` e agora usam `ChevronRight` da biblioteca de ícones.
- A hierarquia de cabeçalho, linhas, divisórias, status e ações permanece consistente entre telas.

## Semântica de estados

- Preto: ativo/finalizado.
- Verde: aberto/confirmado/presente.
- Vermelho suave: bloqueado/recusado/cancelado/ausente.
- Amarelo: lotado/lista de espera/pausado.
- Cinza: pendente/rascunho/preparação/inativo/encerrado.
- Azul: em andamento.

## Superfícies obrigatórias

- Tipografia: DM Sans, peso 550, line-height 1 e rótulos sem quebra.
- Espaçamento: dimensões e alinhamento óptico compartilhados por componente.
- Cores: contraste e diferenciação semântica verificados nos estados renderizados e mapeados.
- Imagens/ativos: ícones Lucide reais, sem glifos ou desenhos CSS improvisados.
- Copy: rótulos originais de cada domínio preservados.

## Interações e estados

- Linhas continuam abrindo seus painéis de detalhe.
- Botões de ação interrompem a propagação e mantêm nomes acessíveis.
- Ordenação, filtros, paginação e empty states não foram alterados.
- Partidas e solicitações estavam sem registros no ambiente; esse é um limite de dados da validação visual, não um desvio da implementação.

## Histórico de comparação

1. P2 inicial: badges e ações tinham implementações diferentes entre cinco tabelas.
2. Correção: criado componente compartilhado com mapeamento de estado, tom e ícone; setas de texto substituídas por ícones.
3. P1 encontrado no primeiro passe: uma regra antiga da agenda sobrescreveu o texto branco do status ativo, deixando-o preto sobre fundo preto.
4. Correção: adicionada especificidade para os tons dentro da tabela de agenda.
5. Pós-correção: `/tmp/clubeone-table-schedules-status-fixed.jpg` confirma contraste e alinhamento corretos; usuários e categorias confirmam consistência entre tabelas.

## Findings

- Nenhum achado P0, P1 ou P2 pendente.

## Follow-up polish

- P3: repetir a captura de Partidas e Solicitações quando o backend tiver registros para documentar visualmente todos os tons específicos dessas telas.

## Validação técnica

- `npm run build`: passou; somente aviso não bloqueante de chunk acima de 500 kB.
- `npm run lint`: passou.
- `npm test`: 3 arquivos e 19 testes passaram.
- `git diff --check`: passou.

## Implementation checklist

- [x] Componente único de status.
- [x] Mapeamento semântico de todos os estados.
- [x] Ícones de ação consistentes.
- [x] Usuários, categorias, agendas e dashboard verificados visualmente.
- [x] Empty states de partidas e solicitações verificados.
- [x] Build, lint e testes aprovados.

final result: passed
