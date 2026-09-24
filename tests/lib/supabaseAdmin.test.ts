import { afterEach, describe, expect, it, vi } from 'vitest';
const createClient = vi.hoisted(() => vi.fn(() => ({ marker: 'admin' })));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });
describe('admin client configuration', () => {
  it('accepts the documented service role key and caches the client', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'documented-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE', 'legacy-key');
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    expect(getSupabaseAdmin()).toBe(getSupabaseAdmin());
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'documented-key', expect.any(Object));
  });
  it('continues supporting existing deployments using the legacy name', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE', 'legacy-key');
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    getSupabaseAdmin();
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'legacy-key', expect.any(Object));
  });
  it('fails before creating a client when no server credential is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE', '');
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    expect(() => getSupabaseAdmin()).toThrow('SUPABASE_SERVICE_ROLE_KEY');
    expect(createClient).not.toHaveBeenCalled();
  });
});
