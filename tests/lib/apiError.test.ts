import { describe, it, expect } from 'vitest';
import {
  apiError,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  rateLimited,
  fileTooLarge,
  internalError,
  handleUnexpectedError,
} from '@/lib/apiError';

describe('apiError (respostas padronizadas SignFlow)', () => {
  it('apiError retorna shape { error, code } com status correto', async () => {
    const res = apiError('NOT_FOUND');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
    expect(typeof body.error).toBe('string');
  });

  it('usa mensagem customizada quando fornecida', async () => {
    const res = apiError('UNAUTHORIZED', 'Faça login.');
    const body = await res.json();
    expect(body.error).toBe('Faça login.');
  });

  it('inclui details e requestId quando fornecidos', async () => {
    const res = apiError('VALIDATION_ERROR', undefined, { email: ['inválido'] }, 'req-1');
    const body = await res.json();
    expect(body.details).toEqual({ email: ['inválido'] });
    expect(body.requestId).toBe('req-1');
  });

  it('atalhos: unauthorized 401, forbidden 403, notFound 404', async () => {
    expect((await unauthorized()).status).toBe(401);
    expect((await forbidden()).status).toBe(403);
    const nf = await (await notFound('Documento')).json();
    expect(nf.error).toContain('Documento');
  });

  it('validationError 400 com details', async () => {
    const res = validationError({ title: ['obrigatório'] });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('rateLimited 429 com retryAfter', async () => {
    const res = rateLimited(60);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('60');
  });

  it('fileTooLarge 413 com tamanhos', async () => {
    const res = fileTooLarge(10, 12.3);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('10MB');
  });

  it('internalError 500 e handleUnexpectedError não vaza stack em produção', async () => {
    const res = internalError();
    expect(res.status).toBe(500);
    const handled = handleUnexpectedError(new Error('boom'), 'req-2');
    expect(handled.status).toBe(500);
    const body = await handled.json();
    expect(body.requestId).toBe('req-2');
  });
});
