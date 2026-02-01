-- Fix: Permitir SELECT de documentos próprios OU sem dono (user_id NULL)
-- Isso corrige o erro "Failed to fetch" no dashboard

-- Remove a policy antiga
DROP POLICY IF EXISTS "own_docs" ON public.documents;

-- Cria nova policy que permite:
-- 1. Documentos do usuário logado (auth.uid() = user_id)
-- 2. Documentos sem dono (user_id IS NULL)
CREATE POLICY "select_own_or_null_docs" 
ON public.documents 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
);

-- Documentação:
-- Esta policy garante que:
-- - Usuários logados veem SEUS documentos
-- - Documentos criados sem user_id (legacy/anonymous) são visíveis
-- - Documentos de OUTROS usuários continuam BLOQUEADOS (segurança mantida)
