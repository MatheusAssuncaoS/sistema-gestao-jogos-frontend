# GameDash — Especificação UX/UI do fluxo administrativo

## 1. Objetivo e escopo

Esta especificação orienta a implementação da primeira versão do ambiente administrativo do GameDash. O foco é permitir que vários administradores trabalhem simultaneamente na análise de cadastros, gestão de usuários e consulta de partidas.

### Incluído na primeira versão

- Visão geral operacional.
- Análise, aprovação e recusa de cadastros.
- Consulta e edição de usuários.
- Bloqueio, desbloqueio, inativação e reativação de contas.
- Redefinição administrativa de senha.
- Consulta de partidas e inscritos.
- Gestão dos dados e da senha do próprio administrador.
- Alternância entre os ambientes Administração, Organização e Jogador, conforme os perfis do usuário.

### Fora da primeira versão

- Calendário administrativo.
- Criação, edição, abertura ou cancelamento de partidas pelo administrador.
- Motivo obrigatório para recusa de cadastro.
- Relatórios analíticos e gráficos decorativos.

## 2. Premissas de produto

- Vários administradores podem operar simultaneamente.
- O volume inicial esperado é de centenas de usuários.
- O administrador pode alterar dados cadastrais de terceiros.
- Uma conta bloqueada representa uma restrição temporária e reversível, normalmente relacionada à segurança.
- Uma conta inativa representa uma desativação administrativa mais duradoura e deixa de participar das operações normais.
- Na redefinição de senha, o administrador pode definir uma senha ou gerar uma provisória.
- A redefinição pode exigir a troca da senha no próximo login.
- A área de partidas é somente leitura no ambiente administrativo.

## 3. Arquitetura da informação

### Navegação principal

1. **Visão geral**
2. **Cadastros**
   - Pendentes
   - Recusados
3. **Usuários**
4. **Partidas**
5. **Minha conta**
6. **Sair**

### Navegação global

O seletor de ambiente fica na barra superior. Deve mostrar apenas ambientes aos quais o usuário tem acesso:

- Administração
- Organização
- Jogador

A troca de ambiente deve levar à página inicial do ambiente escolhido e preservar a sessão.

### Padrão de navegação

- Desktop: sidebar fixa, com possibilidade de colapso na implementação.
- Mobile: sidebar substituída por `Sheet` acionado pelo cabeçalho.
- O item ativo deve ser identificado por fundo neutro, texto de maior contraste e peso médio.
- O contador de cadastros pendentes aparece junto ao item Cadastros.

## 4. Fluxos principais

### 4.1 Analisar cadastro

```text
Cadastros pendentes
→ selecionar cadastro
→ abrir drawer de análise
→ conferir dados e documentos
→ aprovar ou recusar
```

#### Aprovação

1. Análise dos dados enviados.
2. Configuração dos dados de aprovação e perfis de acesso.
3. Revisão final.
4. Confirmação da aprovação.

Antes de confirmar, o sistema deve verificar se o cadastro continua pendente. Se outro administrador já o processou, interromper a ação e mostrar o estado atualizado.

#### Recusa

- Não exige motivo.
- Usa `AlertDialog` para confirmação.
- Após confirmar, remove o registro da fila de pendentes e mostra uma notificação de sucesso.

### 4.2 Gerenciar usuário

```text
Usuários
→ buscar ou filtrar
→ selecionar usuário
→ abrir drawer
→ consultar resumo, editar dados ou gerenciar acesso
```

O drawer possui três áreas:

- **Resumo:** dados principais, perfis e status.
- **Editar:** alteração dos dados cadastrais permitidos.
- **Acesso:** perfis, senha e ações sobre a conta.

As ações de bloquear e inativar devem permanecer visual e semanticamente separadas.

### 4.3 Redefinir senha

```text
Usuário → Acesso → Redefinir senha
→ escolher senha definida ou provisória
→ configurar troca obrigatória no próximo login
→ confirmar
→ conclusão
```

Não há etapa separada de revisão.

Regras:

- A senha definida deve cumprir a política vigente.
- A senha provisória deve ser exibida apenas após a confirmação.
- Deve existir uma ação explícita para copiar a senha provisória.
- O valor não deve reaparecer após fechar a conclusão.

### 4.4 Consultar partida

```text
Partidas
→ buscar ou filtrar
→ selecionar partida
→ abrir drawer
→ consultar detalhes ou inscritos
```

O drawer possui:

- **Detalhes:** status, modalidade, categoria, data, local, responsável e capacidade.
- **Inscritos:** jogadores confirmados e lista de espera, quando aplicável.

Não exibir comandos administrativos para editar ou cancelar a partida.

### 4.5 Atualizar a própria conta

- Dados pessoais: nome, telefone e foto.
- O e-mail é somente leitura nessa versão.
- Segurança: alteração da própria senha e consulta do último acesso.

## 5. Especificação por tela

### Visão geral

Priorizar trabalho pendente, sem gráficos:

- Cadastros pendentes, com ação **Analisar fila**.
- Contas bloqueadas, com ação **Revisar usuários**.
- Partidas nos próximos sete dias, com ação **Ver partidas**.
- Lista dos cadastros pendentes mais antigos.
- Lista das próximas partidas.
- Alerta para contas bloqueadas há mais de sete dias.

### Cadastros

- Abas: Pendentes e Recusados.
- Busca por nome ou e-mail.
- Filtros por perfil e período, quando houver dados suficientes.
- Tabela paginada e ordenada pelos pendentes mais antigos primeiro.
- Abertura do drawer ao selecionar a linha.
- Ação primária contextual: aprovar cadastro.
- Ação destrutiva: recusar cadastro.

### Usuários

- Busca por nome ou e-mail.
- Filtros por status e perfil.
- Tabela paginada.
- Colunas mínimas: usuário, perfis, status, última atualização e ações.
- Drawer de resumo, edição e acesso.
- Ações sobre a conta sempre acompanhadas de explicação curta.

### Partidas

- Busca por equipe ou local.
- Filtros por status e período.
- Colunas mínimas: partida, data e horário, local, inscritos e status.
- Drawer somente para consulta.

### Minha conta

- Navegação local entre Dados pessoais e Segurança.
- Formulários com ações Cancelar e Salvar.
- Confirmação de sucesso por `Sonner`/toast.

## 6. Padrões de interação

### Drawer ou modal

- Usar `Sheet`/drawer para consultar ou editar um registro sem perder o contexto da lista.
- Usar `Dialog` para tarefas curtas que exigem foco, como redefinição de senha.
- Usar `AlertDialog` para ações destrutivas ou mudanças relevantes de status.

### Tabelas

- Linha inteira pode abrir o registro; controles internos não devem disparar a linha.
- Ordenação deve informar visualmente a coluna e direção atuais.
- Paginação no rodapé, com intervalo e total de registros.
- Manter cabeçalhos e dados essenciais legíveis em 320 px; quando necessário, trocar a tabela por lista responsiva.

### Feedback

- Ação iniciada: botão em loading e controles relacionados desabilitados.
- Sucesso: toast curto, sem exigir fechamento.
- Erro recuperável: mensagem próxima à ação, preservando os dados preenchidos.
- Erro global: bloco de erro com ação Tentar novamente.
- Conflito concorrente: aviso persistente, dados atualizados e orientação clara.

## 7. Estados obrigatórios

Cada tela com dados remotos deve prever:

### Carregamento

- Skeletons com a mesma estrutura do conteúdo final.
- Evitar spinner isolado no centro da página.

### Vazio inicial

- Título objetivo.
- Explicação curta.
- Ação somente quando existir uma próxima etapa útil.

### Busca sem resultados

- Informar que nenhum resultado corresponde aos filtros.
- Oferecer **Limpar filtros**.

### Erro

- Preservar o shell e o contexto da página.
- Informar o que não pôde ser carregado.
- Oferecer **Tentar novamente**.

### Conflito entre administradores

Mensagem recomendada:

> Este cadastro foi atualizado por outro administrador. Os dados exibidos foram atualizados.

Não sobrescrever silenciosamente uma versão mais recente. A API deve oferecer versão, ETag ou data de atualização para controle otimista de concorrência.

### Confirmações destrutivas

- Título com verbo e objeto: **Inativar conta?**
- Explicar o efeito e a reversibilidade.
- Botões: **Cancelar** e a ação explícita, como **Inativar conta**.
- Foco inicial em Cancelar.

## 8. Design system

### Base recomendada

- Tailwind CSS v4.
- shadcn/ui no estilo `new-york`.
- Variáveis semânticas em CSS com cores OKLCH.
- Base neutra; cor reservada para significado funcional.
- Ícones Lucide.

### Componentes shadcn/ui

- `Sidebar` e `Sheet`
- `Breadcrumb`
- `Button`
- `Input`
- `Select`
- `Tabs`
- `Table`
- `DropdownMenu`
- `Badge`
- `Dialog`
- `AlertDialog`
- `Skeleton`
- `Tooltip`
- `Sonner`
- TanStack Table para paginação, filtros e ordenação

### Tokens visuais

- Fundo da aplicação: neutro muito claro/escuro conforme o tema.
- Superfícies: `background`/`card`.
- Bordas discretas: `border`.
- Texto principal: `foreground`.
- Texto secundário: `muted-foreground`.
- Ação primária: neutra de alto contraste.
- Sucesso: verde.
- Alerta: âmbar.
- Erro ou bloqueio: vermelho.
- Informação e estado agendado: azul.

### Geometria e densidade

- Raio padrão de controles: 6 px.
- Raio padrão de painéis: 8 px.
- Altura de inputs e botões: 36 px.
- Linhas de tabela: 48–54 px.
- Espaçamento moderado em formulários e compacto em tabelas.
- Peso tipográfico predominante: 400; títulos e ações: 500.

## 9. Conteúdo e nomenclatura

- Preferir verbos explícitos: **Aprovar cadastro**, **Bloquear conta**, **Alterar senha**.
- Não usar apenas **Confirmar** quando a ação puder ser nomeada.
- Usar **Cadastros** para solicitações ainda não aprovadas.
- Usar **Usuários** para contas já existentes.
- Usar **Bloqueado** para restrição temporária.
- Usar **Inativo** para desativação administrativa.
- Datas no padrão `dd/mm/aaaa`; horário em 24 horas.

## 10. Acessibilidade

- Contraste mínimo conforme WCAG AA.
- Todos os campos com `label` visível.
- Ações apenas com ícone precisam de nome acessível e tooltip quando necessário.
- Foco visível em todos os controles.
- Drawer e dialogs devem capturar foco e devolvê-lo ao acionador ao fechar.
- Mensagens de erro devem ser associadas ao campo correspondente.
- Status não pode depender apenas da cor; sempre usar texto.
- Suportar teclado e larguras a partir de 320 px.

## 11. Critérios de aceite gerais

- O menu identifica corretamente a página atual.
- O seletor de ambiente mostra apenas perfis disponíveis.
- Filtros e busca podem ser combinados e limpos.
- A paginação preserva os filtros ativos.
- Abrir e fechar drawers preserva a posição e os filtros da lista.
- A interface impede envio duplicado durante operações assíncronas.
- Alterações concorrentes não sobrescrevem dados silenciosamente.
- Toda operação exibe feedback de sucesso ou erro.
- A interface funciona por teclado e em telas pequenas.
- Estados de carregamento, vazio, erro e ausência de resultados estão implementados.

## 12. Ordem sugerida de implementação

1. Tokens, tipografia e componentes base.
2. Shell administrativo e troca de ambiente.
3. Tabelas, filtros, paginação e estados compartilhados.
4. Cadastros e fluxo de aprovação/recusa.
5. Usuários, edição, status e redefinição de senha.
6. Partidas em modo de consulta.
7. Visão geral.
8. Minha conta.
9. Acessibilidade, responsividade e testes de estados de borda.
