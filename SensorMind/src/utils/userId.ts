/**
 * 匿名用户 ID 工具
 * 首次访问时生成 UUID 并持久化到 localStorage，后续复用。
 * 不依赖任何登录机制，跨会话保持稳定。
 */

const STORAGE_KEY = 'sensormind_user_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级兼容旧浏览器
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 获取当前用户的匿名 ID（自动创建并持久化）
 */
export function getUserId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage 不可用时（隐私模式等），返回临时 ID（不持久）
    return generateUUID();
  }
}
