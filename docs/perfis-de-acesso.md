# Perfis de acesso

O perfil agrupa permissões por área e ação. Um usuário pode ter vários perfis; seus acessos efetivos são a união das permissões dos perfis ativos. Conta fora do status ATIVO não recebe permissões. Inativar um perfil preserva os vínculos, mas deixa de conceder seus acessos.

## Dados

- Identificador, código interno estável, nome obrigatório (até 80 caracteres, único sem diferenciar maiúsculas e minúsculas), descrição opcional (até 255 caracteres).
- Status ativo/inativo, indicador de perfil do sistema, versão para concorrência e permissões.
- A listagem inclui quantidade de usuários vinculados, independentemente do status da conta.
- O código legado de `papel` e a relação `usuario_papel` são preservados. A migração V20 acrescenta os dados e a tabela `papel_permissao`.

## Áreas e permissões

| Área | Consulta | Ações adicionais |
| --- | --- | --- |
| Perfis de acesso | Perfis e permissões | Criar, editar e inativar perfis personalizados |
| Usuários | Dados e perfis das contas | Gerenciar contas; vincular perfis; redefinir senhas (permissões separadas) |
| Jogadores | Associados aprovados | A aprovação ocorre em Solicitações |
| Solicitações | Cadastros pendentes e recusados | Aprovar, recusar e reabrir solicitações |
| Partidas | Partidas e calendário | Criar; editar; abrir inscrições; cancelar; excluir rascunhos; consultar inscritos (permissões separadas) |
| Cadastros | Locais, modalidades e categorias | Criar, editar e excluir registros |
| Bloqueios de calendário | Agendas, funcionamento, bloqueios e locais de referência | Gerenciar agendas e bloqueios |
| Arbitragem | Partidas, participantes e estado | Conduzir partida, escala, cronômetro, gols, punições e resultado |
| Área do jogador | Partidas e próprias inscrições | Inscrever-se e cancelar a própria inscrição; acesso reservado à aprovação do associado |

As ações exigem consulta da mesma área. O formulário inclui essa dependência automaticamente e o backend rejeita configurações incoerentes. Remover consulta no formulário remove também as ações dependentes. Permissão nunca dispensa validações do domínio: capacidade, situação associativa, estado da partida e vínculos continuam sendo verificados.

## Perfis do sistema

- **Administrador**: áreas administrativas, segurança e gestão de partidas. Arbitragem e participação como jogador são acessos separados.
- **Organizador**: consulta e gestão das partidas e dos inscritos.
- **Árbitro**: consulta e condução da arbitragem.
- **Jogador**: consulta e gestão das próprias inscrições, concedido apenas pela aprovação do associado.

Os quatro perfis são protegidos contra edição e inativação. Administrador, Organizador e Árbitro podem servir de modelo; copiar um modelo cria um perfil independente, sem herança posterior. Jogador não é modelo personalizável e não pode ser atribuído no cadastro administrativo.

## Concessão e revogação

- Cadastro e edição de usuários usam IDs dos perfis persistidos, incluindo personalizados. Novos usuários recebem senha provisória.
- Só perfis ativos podem ser atribuídos. Para retirar o último perfil de funcionário, substitua-o por outro ou inative a conta.
- Um operador delegado só concede ou gerencia permissões que possui. Apenas um Administrador do sistema pode conceder o perfil Administrador ou gerenciar contas administrativas.
- O usuário não pode substituir os próprios perfis. O vínculo de Jogador é preservado ao editar perfis administrativos.
- O backend consulta as permissões atuais a cada operação protegida: alterações e revogações valem na próxima requisição, inclusive em sessões existentes.
- O frontend restringe rotas, menus e ações e atualiza os acessos ao recuperar foco ou a cada minuto. A segurança efetiva permanece no servidor.
- O cache de dados é limpo na troca de identidade e na atualização das permissões.
- Alterações em perfis e vínculos produzem registros de auditoria nos logs. A versão evita sobrescrever uma edição concorrente.

## API

- `GET /api/admin/perfis`: lista perfis e contagens.
- `GET /api/admin/perfis/permissoes`: catálogo de permissões, descrições e dependências.
- `POST /api/admin/perfis`: cria perfil personalizado.
- `PUT /api/admin/perfis/{id}`: edita perfil; exige versão atual.
- `PUT /api/admin/usuarios/{id}/perfis`: substitui perfis administrativos; exige versão atual do usuário.
- `POST /api/admin/usuarios`: aceita `perfilIds`; o formato legado `papeis` continua restrito ao Administrador.
- As respostas de autenticação e usuários incluem `perfis` e `permissoes`, além dos códigos legados dos perfis do sistema.

## Verificação

Os testes exercitam migração dos perfis padrão, cadastro, nomes duplicados, dependências, acesso de consulta, tentativa de escrita, acesso a outras áreas, soma de perfis, inativação e revogação em sessão existente, versões concorrentes, proteção dos padrões, escalada de privilégios, atribuição de perfil personalizado e autenticação obrigatória.
