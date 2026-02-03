-- ==================================================
-- POLÍTICAS RLS PARA CERTIFICATE_PROFILES
-- ==================================================

-- Habilitar RLS na tabela certificate_profiles
ALTER TABLE certificate_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Usuários podem ver apenas seus próprios perfis
CREATE POLICY "Users can view their own profiles"
ON certificate_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Usuários podem criar seus próprios perfis
CREATE POLICY "Users can create their own profiles"
ON certificate_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Usuários podem atualizar apenas seus próprios perfis
CREATE POLICY "Users can update their own profiles"
ON certificate_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Usuários podem deletar apenas seus próprios perfis
CREATE POLICY "Users can delete their own profiles"
ON certificate_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==================================================
-- POLÍTICAS RLS PARA CERTIFICATES
-- ==================================================

-- Habilitar RLS na tabela certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 1. Usuários podem ver apenas seus próprios certificados
CREATE POLICY "Users can view their own certificates"
ON certificates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Usuários podem criar seus próprios certificados
CREATE POLICY "Users can create their own certificates"
ON certificates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Usuários podem atualizar apenas seus próprios certificados
CREATE POLICY "Users can update their own certificates"
ON certificates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Usuários podem deletar apenas seus próprios certificados
CREATE POLICY "Users can delete their own certificates"
ON certificates
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
