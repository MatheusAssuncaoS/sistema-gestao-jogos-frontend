/**
 * Cliente HTTP centralizado.
 *
 * Todo o resto do frontend passa por aqui, em vez de chamar fetch direto. Isso
 * garante três coisas importantes:
 *
 * 1. credentials: 'include' em toda requisição, para o cookie de sessão do
 *    backend seguir junto (JSESSIONID).
 * 2. Content-Type: application/json em requisições com corpo.
 * 3. Tratamento uniforme de erro, decodificando o ProblemDetail (RFC 7807)
 *    que o backend devolve, para o chamador receber uma exceção com detail
 *    e status em vez de precisar interpretar a resposta em cada tela.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly campos: Record<string, string> | undefined;

  constructor(status: number, detail: string, campos?: Record<string, string>) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.campos = campos;
  }
}

/**
 * Erro de rede: o fetch nem chegou a receber uma resposta (sem conexão,
 * servidor fora do ar, CORS, etc), ou o gateway na frente do backend devolveu
 * um erro de infraestrutura (502/503/504) em vez de uma resposta da
 * aplicação. Em ambos os casos não há um ProblemDetail para interpretar, e o
 * usuário precisa da mesma mensagem: o servidor está inacessível, não que o
 * pedido em si tenha algo errado. Distinto de ApiError, que representa uma
 * resposta HTTP de erro vinda da aplicação.
 */
export class ErroDeRede extends Error {
  constructor() {
    super('Falha de conexão com o servidor.');
    this.name = 'ErroDeRede';
  }
}

const STATUS_DE_GATEWAY = new Set([502, 503, 504]);

interface ProblemDetail {
  detail?: string;
  title?: string;
  status?: number;
  campos?: Record<string, string>;
}

async function requisicao<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ErroDeRede();
  }

  if (STATUS_DE_GATEWAY.has(resposta.status)) {
    throw new ErroDeRede();
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const conteudo = resposta.headers.get('content-type') ?? '';
  const corpo = conteudo.includes('json') ? await resposta.json() : null;

  if (!resposta.ok) {
    const problema = corpo as ProblemDetail | null;
    throw new ApiError(
      resposta.status,
      problema?.detail ?? problema?.title ?? 'Erro ao comunicar com o servidor.',
      problema?.campos
    );
  }

  return corpo as T;
}

export const api = {
  get: <T>(caminho: string) => requisicao<T>(caminho),

  post: <T>(caminho: string, corpo?: unknown) =>
    requisicao<T>(caminho, {
      method: 'POST',
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }),

  put: <T>(caminho: string, corpo?: unknown) =>
    requisicao<T>(caminho, {
      method: 'PUT',
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }),

  delete: <T>(caminho: string) =>
    requisicao<T>(caminho, {
      method: 'DELETE',
    }),
};
