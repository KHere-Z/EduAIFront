import docx, re, sys

def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('`', '\\`').replace('${', '\\${')

def convert(fname, strip_toc_before=None):
    d = docx.Document(fname + '.docx')
    out = []
    seen_special = not strip_toc_before
    for p in d.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        if strip_toc_before and not seen_special:
            if t.startswith(strip_toc_before):
                seen_special = True
            elif re.match(r'^[一二三四五六七八九十]+、', t):
                continue  # 跳过目录里的标题行
        if re.match(r'^《.+》$', t):
            out.append(f'<h2>{esc(t)}</h2>')
        elif t.startswith('更新时间'):
            out.append(f'<p class="meta">{esc(t)}</p>')
        elif re.match(r'^[一二三四五六七八九十]+、', t):
            out.append(f'<h3>{esc(t)}</h3>')
        else:
            out.append(f'<p>{esc(t)}</p>')
    return '\n'.join(out)

user = convert('智学AI网用户协议')
privacy = convert('智学AI网隐私政策', strip_toc_before='【特别提示】')

js = '// 智学AI网用户协议 / 隐私政策 —— 由 docs/*.docx 生成，请勿手改此文件\n'
js += '// 更新文档后运行根目录 gen_agreements.py 重新生成\n\n'
js += 'export const USER_AGREEMENT_HTML = `' + user + '`\n\n'
js += 'export const PRIVACY_POLICY_HTML = `' + privacy + '`\n'

with open('web/src/views/login/agreementContent.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('WROTE agreementContent.js, user chars:', len(user), 'privacy chars:', len(privacy))
