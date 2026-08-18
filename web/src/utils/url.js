// 统一 URL 解析：避免在组件里硬编码 localhost，支持环境变量覆盖
// 生产环境默认走相对路径，由 Nginx 反代 /api、/uploads

export const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

/**
 * 解析静态资源 / 上传文件 URL（如 /uploads/xxx）
 * - 绝对地址（http/https）或 data:/blob: 原样返回
 * - 相对路径拼上 VITE_UPLOAD_BASE（默认空 → 保持相对，由反代处理）
 */
export function resolveStaticUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  const base = import.meta.env.VITE_UPLOAD_BASE || ''
  return base + url
}
