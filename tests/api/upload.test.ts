// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), upload: vi.fn(), insert: vi.fn(), audit: vi.fn(), admin: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/supabaseAdmin', () => ({ getSupabaseAdmin: mocks.admin }));
vi.mock('@/lib/audit', () => ({ logAudit: mocks.audit, extractIpFromRequest: vi.fn() }));
vi.mock('@/lib/middleware/rateLimit', () => ({
  uploadRateLimiter: () => async () => ({ allowed: true, headers: {} }),
  addRateLimitHeaders: (response: Response) => response,
}));
vi.mock('@/lib/fileValidation', () => ({
  validatePDF: async () => ({ valid: true }), validateImage: async () => ({ valid: true }),
}));
import { POST } from '@/app/api/upload/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-owner' } }, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.insert.mockReturnValue({ select: () => ({ maybeSingle: async () => ({ error: null }) }) });
  mocks.admin.mockReturnValue({
    storage: { from: () => ({ upload: mocks.upload }) },
    from: () => ({ insert: mocks.insert }),
  });
});

function request(owner?: string) {
  const form = new FormData();
  form.set('pdf', new File(['%PDF-1.7\n'], 'example.pdf', { type: 'application/pdf' }));
  if (owner) form.set('user_id', owner);
  return { headers: new Headers(), formData: async () => form } as unknown as NextRequest;
}

describe('upload ownership', () => {
  it('rejects invalid metadata before writing files to storage', async () => {
    const req = request();
    const form = await req.formData();
    form.set('positions', 'invalid-json');
    expect((await POST(req)).status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it.each([undefined, 'another-user'])('uses the verified owner regardless of submitted ID %s', async owner => {
    expect((await POST(request(owner))).status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'verified-owner' }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'verified-owner' }));
  });
  it.each([
    { data: { user: null }, error: null },
    { data: { user: { id: 'untrusted' } }, error: { message: 'invalid token' } },
  ])('rejects an unverified session before creating an admin client', async result => {
    mocks.getUser.mockResolvedValue(result);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
