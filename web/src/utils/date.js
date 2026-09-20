// 本地时区的 YYYY-MM-DD。
// 不要用 new Date().toISOString().slice(0,10)：那是 UTC，在东八区每天 00:00–08:00 之间
// 会返回前一天，导致「今日课程」筛出昨天的课、日历把昨天标成今天。
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
