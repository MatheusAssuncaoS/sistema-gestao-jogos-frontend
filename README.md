# Sistema de Gestão de Jogos — Frontend

Interface web do [Sistema de Gestão de Jogos](https://github.com/MatheusAssuncaoS/sistema-gestao-jogos), o backend em Spring Boot que cuida da gestão das partidas de um clube esportivo.

> Projeto em desenvolvimento incremental, com releases versionadas por marco. Acompanhe pelas [tags](../../tags) e [milestones](../../milestones).

## O que este frontend faz

Este cliente cobre os três perfis do sistema, cada um com sua área:

- **Jogador**, consulta as partidas abertas, se inscreve, cancela e acompanha suas próximas partidas.
- **Organizador**, cria e edita partidas, controla o ciclo de vida (abrir, cancelar) e consulta os inscritos.
- **Administrador**, aprova cadastros, gerencia organizadores e configura o calendário de funcionamento do clube.

O redirecionamento após o login é automático conforme o papel do usuário.

## Roadmap

| Marco | Versão | Escopo | Status |
|-------|--------|--------|--------|
| 0 — Fundação | `v0.0.1` | Setup, roteamento, autenticação e CI | ✅ Concluído |
| 1 — Área do jogador | `v1.0.0` | Cadastro, login, consulta e inscrição em partidas | Planejado |
| 2 — Área do organizador | `v2.0.0` | Criação e gestão de partidas, listagem de inscritos | Planejado |
| 3 — Área do administrador | `v3.0.0` | Aprovação de jogadores, gestão de organizadores e calendário | Planejado |

## Stack

- **React 19** + **TypeScript**
- **Vite** para o bundler e o dev server
- **Tailwind CSS** + **shadcn/ui** para a interface
- **React Router** para o roteamento
- **TanStack Query** para o estado do servidor
- **Vitest** + **Testing Library** para os testes
- **GitHub Actions** para integração contínua

## Decisões técnicas

### Autenticação por cookie de sessão

O backend autentica via `JSESSIONID` em cookie `HttpOnly`, então o cliente HTTP envia `credentials: 'include'` em todas as requisições e o navegador cuida do resto. O frontend não armazena token nem senha, e o logout é feito por `POST /api/auth/logout`.

Um `AuthContext` chama `GET /api/auth/eu` no boot do app para descobrir se há sessão ativa. As rotas protegidas consultam esse contexto para decidir se renderizam ou redirecionam para o login. A troca de papel no backend só se reflete no cliente após novo login, uma consequência da estratégia de sessão que fica registrada no [ADR de autenticação do backend](https://github.com/MatheusAssuncaoS/sistema-gestao-jogos).

### Estado do servidor com TanStack Query

Todo dado que vem da API passa pelo TanStack Query, que cuida de cache, refetch, loading e erros de forma padronizada. Isso substitui o `useEffect` com `fetch` manual, que exigiria repetir os mesmos padrões em toda tela.

## Como rodar

*Instruções disponíveis após o setup inicial do projeto (Marco 0).*

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.
