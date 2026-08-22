
-- 1. plans 表增加 user_id 列
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT 'legacy';

-- 2. 为 user_id 建索引，查询加速
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans (user_id);

-- 3. 删除旧的宽泛 RLS 策略（按名称精确匹配）
DROP POLICY IF EXISTS "Allow anon select" ON plans;
DROP POLICY IF EXISTS "Allow anon insert" ON plans;
DROP POLICY IF EXISTS "Allow anon update plan_name" ON plans;
DROP POLICY IF EXISTS "Allow authenticated full access" ON plans;
DROP POLICY IF EXISTS "anon_select" ON plans;
DROP POLICY IF EXISTS "anon_insert" ON plans;
DROP POLICY IF EXISTS "anon_update" ON plans;
DROP POLICY IF EXISTS "auth_all" ON plans;

-- 4. 确保 RLS 已开启
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 5. 新策略：anon 只能访问自己的行（通过 user_id header 传入）
CREATE POLICY "user_select_own" ON plans
  FOR SELECT TO anon
  USING (user_id = current_setting('request.headers', true)::json->>'x-user-id');

CREATE POLICY "user_insert_own" ON plans
  FOR INSERT TO anon
  WITH CHECK (user_id = current_setting('request.headers', true)::json->>'x-user-id');

CREATE POLICY "user_update_own" ON plans
  FOR UPDATE TO anon
  USING (user_id = current_setting('request.headers', true)::json->>'x-user-id');

CREATE POLICY "user_delete_own" ON plans
  FOR DELETE TO anon
  USING (user_id = current_setting('request.headers', true)::json->>'x-user-id');

-- 6. authenticated 用户保持全量访问（管理员）
CREATE POLICY "auth_all" ON plans
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
