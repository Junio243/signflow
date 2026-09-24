import { describe, it, expect } from 'vitest';
import {
  getFriendlyErrorMessage,
  formatErrorForDisplay,
  getErrorMessage,
} from '@/lib/errorMessages';

describe('errorMessages (i18n PT/EN/ES)', () => {
  it('traduz credenciais inválidas em PT', () => {
    const err = getFriendlyErrorMessage(new Error('Invalid login credentials'), 'pt');
    expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(err.message).toContain('E-mail ou senha');
    expect(err.suggestion).toBeTruthy();
  });

  it('traduz o mesmo erro em EN e ES', () => {
    expect(
      getFriendlyErrorMessage(new Error('Invalid login credentials'), 'en').message
    ).toContain('Incorrect email');
    expect(
      getFriendlyErrorMessage(new Error('Invalid login credentials'), 'es').message
    ).toContain('Correo o contraseña');
  });

  it('detecta arquivo muito grande, sessão expirada e 404', () => {
    expect(
      getFriendlyErrorMessage(new Error('payload too large'), 'pt').code
    ).toBe('FILE_TOO_LARGE');
    expect(
      getFriendlyErrorMessage(new Error('session_not_found'), 'pt').code
    ).toBe('SESSION_EXPIRED');
    expect(getFriendlyErrorMessage({ code: '404' }, 'pt').code).toBe('NOT_FOUND');
  });

  it('formatErrorForDisplay junta mensagem + sugestão', () => {
    const text = formatErrorForDisplay(new Error('Invalid login credentials'), 'pt');
    expect(text.length).toBeGreaterThan(20);
    expect(text).toContain('E-mail ou senha');
  });

  it('getErrorMessage retorna só a mensagem', () => {
    const msg = getErrorMessage(new Error('fetch failed'), 'en');
    expect(msg).toContain('Connection error');
  });

  it('string simples passa direto', () => {
    expect(getFriendlyErrorMessage('Erro custom', 'pt').message).toBe('Erro custom');
  });

  it('erro desconhecido cai em UNKNOWN_ERROR', () => {
    const err = getFriendlyErrorMessage(new Error('xyz-inédito-123'), 'pt');
    expect(err.code).toBe('UNKNOWN_ERROR');
  });
});
