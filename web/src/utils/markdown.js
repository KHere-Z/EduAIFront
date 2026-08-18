/**
 * Markdown + LaTeX 数学公式渲染
 * 使用 marked (markdown→HTML) + KaTeX (数学公式)
 * 本地 npm 依赖（marked / katex），避免运行时从 esm.sh CDN 动态加载
 * （esm.sh 在国内经常被墙/超时，会导致 AI 内容无法渲染）
 */

import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import DOMPurify from 'dompurify'

/**
 * 渲染 markdown 文本为 HTML（含数学公式）
 * @param {string} text - AI 返回的原始 markdown
 * @returns {Promise<string>} HTML 字符串
 */
export async function renderMarkdown(text) {
  if (!text) return ''

  // 清洗：部分模型会输出私有区占位符，先清除
  text = text.replace(/MI\d+|MB\d+|/g, '')

  // 0. 预处理：包裹裸上标/下标为 $...$（仅处理不含 $ 的行）
  text = text.split('\n').map(line => {
    if (/\$/.test(line)) return line  // 已有 $，跳过
    return line
      .replace(/([a-zA-Z0-9)])\^(?:\{([^}]+)\}|(\d+))/g, (_, b, braced, plain) => `${b}$^{${braced || plain}}$`)
      .replace(/([a-zA-Z0-9)])_(?:\{([^}]+)\}|(\d+))/g, (_, b, braced, plain) => `${b}$_{${braced || plain}}$`)
  }).join('\n')

  // 1. 保护行内代码和代码块，避免被 markdown/math 处理
  const codeBlocks = []
  let processed = text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`)
      return `%%CODEBLOCK_${codeBlocks.length - 1}%%`
    })
    .replace(/`([^`]+)`/g, (_, code) => {
      codeBlocks.push(`<code>${escapeHtml(code)}</code>`)
      return `%%INLINECODE_${codeBlocks.length - 1}%%`
    })

  // 2. 保护 LaTeX 数学公式
  const mathBlocks = []
  // 块级 $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    mathBlocks.push({ type: 'block', tex: math.trim() })
    return `MB${mathBlocks.length - 1}`
  })
  // 行内 $...$
  processed = processed.replace(/\$(.+?)\$/g, (_, math) => {
    mathBlocks.push({ type: 'inline', tex: math.trim() })
    return `MI${mathBlocks.length - 1}`
  })
  // LaTeX 标准 \(...\) 行内
  processed = processed.replace(/\\\((.+?)\\\)/g, (_, math) => {
    mathBlocks.push({ type: 'inline', tex: math.trim() })
    return `MI${mathBlocks.length - 1}`
  })
  // LaTeX 标准 \[...\] 块级
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    mathBlocks.push({ type: 'block', tex: math.trim() })
    return `MB${mathBlocks.length - 1}`
  })
  // LaTeX 环境 \begin{...}...\end{...}
  processed = processed.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env, body) => {
    mathBlocks.push({ type: 'block', tex: `\\begin{${env}}${body}\\end{${env}}` })
    return `MB${mathBlocks.length - 1}`
  })
  // DeepSeek 用 [ \frac{x}{y} ] 输出公式
  processed = processed.replace(/\[([^\]]+)\]/g, (match, content) => {
    if (!content.includes('\\')) return match
    mathBlocks.push({ type: 'block', tex: content.trim() })
    return `MB${mathBlocks.length - 1}`
  })

  // 3. Markdown → HTML
  let html = marked.parse(processed)

  // 4. 渲染数学公式（null字符标记不会被 marked 修改）
  for (let i = 0; i < mathBlocks.length; i++) {
    const m = mathBlocks[i]
    const token = m.type === 'block' ? `MB${i}` : `MI${i}`
    try {
      const rendered = katex.renderToString(m.tex, {
        throwOnError: false,
        displayMode: m.type === 'block'
      })
      html = html.replace(token, rendered)
    } catch {
      html = html.replace(token, `<code>${escapeHtml(m.tex)}</code>`)
    }
  }

  // 5. 恢复代码块
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i])
    html = html.replace(`%%INLINECODE_${i}%%`, codeBlocks[i])
  }

  // 6. 消毒：移除脚本/事件处理器/危险 URL，防止 XSS（AI 与老师内容经 v-html 渲染）
  return sanitizeHtml(html)
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 消毒 HTML，移除脚本/事件处理器/危险协议，防 XSS。
 * 用于所有经 v-html 渲染的不可信内容（AI 输出、老师上传的题目/解析等）。
 * 默认配置已保留 class/style，KaTeX 公式的 HTML 输出可正常显示。
 */
export function sanitizeHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html)
}
