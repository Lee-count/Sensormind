import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/utils/userId";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase 客户端
 * 每次请求自动注入 x-user-id header，配合 RLS 实现数据隔离。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      get 'x-user-id'() {
        return getUserId();
      },
    },
  },
});
            