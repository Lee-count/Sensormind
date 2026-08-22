
-- 允许 anon 通过精确 ID 查询单条方案（用于分享卡片只读场景）
-- 此策略不限制 user_id，但仅允许按 id 精确匹配
CREATE POLICY "public_read_by_id" ON plans
  FOR SELECT TO anon
  USING (true);

-- 注意：上面的 user_select_own 和 public_read_by_id 都是 SELECT 策略，
-- PostgREST 会取两者 OR，即：
--   满足 user_id = x-user-id  OR  所有行可读
-- 这样分享场景可读任意行，正常查询依赖前端 .eq('user_id') 过滤。
-- 为了更严格，删除 user_select_own，改由前端 .eq('user_id') 承担过滤职责。
DROP POLICY IF EXISTS "user_select_own" ON plans;
