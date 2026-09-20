// 后端把「一组图片」塞进单个字符串列，先后用过三种分隔符，读取端必须全部认：
//
//   ||||  老师批改图   correctedImageUrl  （correctSubmission 追加时拼的，注释写明「避开 base64 逗号冲突」）
//   \n    答案解析     answerFileUrl     （老师端 join('\n')）
//   ,     学生提交图   submittedImageUrl （后端 Collectors.joining(",")）
//
// 拆分顺序不能颠倒，症结是 data URL 头部自带逗号（data:image/jpeg;base64,/9j/...）：
//   - |||| 和 \n 不可能出现在 data URL 内部 → 可以无条件先拆
//   - 逗号只有「后面紧跟 data:image/」时才能确定是分隔符 —— base64 字母表是 A-Za-z0-9+/=，
//     不含逗号，所以 data URL 内部不可能出现这个组合。旧的裸 split(',') 既把单张 data URL
//     拆成两半（头 + 体），又把「多张 data URL 逗号拼」当成一张，两头都错。
//   - 剩下的逗号才是普通 URL 列表的分隔符
//
// 收敛到一处是因为这套规则已经在三个读取点各抄一遍并互相走样过：
// MathManage 按 \n 拆 |||| 拼的批改图（两张以上读不出来），Homework 用裸逗号拆 data URL。
export function parseImageList(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(u => (typeof u === 'object' ? u : { url: String(u) })).filter(i => i.url)
  const str = String(val).trim()
  if (!str) return []
  if (str.includes('||||') || str.includes('\n')) return toItems(str.split(/\|\|\|\||\n/))
  if (/,(?=data:image\/)/.test(str)) return toItems(str.split(/,(?=data:image\/)/))
  if (str.startsWith('data:')) return [{ url: str }]
  return toItems(str.split(','))
}

function toItems(arr) {
  return arr.map(u => u.trim()).filter(Boolean).map(u => ({ url: u }))
}
