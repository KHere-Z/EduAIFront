/**
 * Dynagraph 几何交互动图渲染引擎 —— 自研轻量几何渲染内核（Canvas/JSXGraph）
 *
 * 解析后端 AI 下发的几何 Schema（见 docs/spec/12-animation-backend-guide.md），
 * 渲染可手动播放、可定位最值、含图例/辅助线/填充/目标线段高亮的交互动图。
 *
 * Schema 核心字段：
 *   fixedPoints  固定点（黑）
 *   driverPoints 主动点（青，滑杆驱动，内嵌 range）
 *   drivenPoints 从动点（红，几何变换 transform，不写死坐标）
 *   segTarget    目标线段（绿，最值目标）
 *   shapes       主图形（含淡黄填充）
 *   auxLines     辅助线（橙虚线）
 *   uiConfig     UI 组件开关
 *   knowledgeTags 知识点标签
 *
 * 从动点由几何变换实时计算（旋转/翻折/中点/平行四边形/等边第三点），拖动滑杆全程联动。
 */

import JXG from 'jsxgraph'

// ============================================================
// 表达式编译（函数图像用，安全白名单 + 零反斜杠正则）
// ============================================================
const FUNC_NAMES = ['sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'abs', 'pow', 'pi']

export function compileExpr(expr) {
  if (!expr || typeof expr !== 'string') return null
  const raw = expr.trim()
  if (!raw) return null
  const stripped = raw.replace(/[a-zA-Z_]+/g, (m) => (m === 'x' || FUNC_NAMES.includes(m) ? '' : '#'))
  if (stripped.indexOf('#') >= 0) throw new Error('非法表达式：' + expr)
  const clean = stripped.split(' ').join('')
  if (!/^[0-9+*/^().,-]+$/.test(clean)) throw new Error('非法表达式：' + expr)
  let js = raw
    .split('^').join('**')
    .replace(/([0-9])(x)/g, '$1*$2')
    .replace(/(x)([0-9])/g, '$1*$2')
    .replace(/([)])([(])/g, '$1*$2')
    .replace(/pi/g, 'Math.PI')
  js = js.replace(/sin|cos|tan|sqrt|log|exp|abs|pow/g, (m) => 'Math.' + m)
  const fn = new Function('x', 'return (' + js + ')')
  fn(0)
  return fn
}

// ============================================================
// 数学工具
// ============================================================
function deg2rad(d) { return d * Math.PI / 180 }

function rotatePoint(p, c, angleDeg) {
  const rad = deg2rad(angleDeg)
  const dx = p[0] - c[0], dy = p[1] - c[1]
  const cos = Math.cos(rad), sin = Math.sin(rad)
  return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos]
}

function midpoint(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }

function reflectLine(p, l1, l2) {
  const dx = l2[0] - l1[0], dy = l2[1] - l1[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return [p[0], p[1]]
  const t = ((p[0] - l1[0]) * dx + (p[1] - l1[1]) * dy) / len2
  const proj = [l1[0] + t * dx, l1[1] + t * dy]
  return [2 * proj[0] - p[0], 2 * proj[1] - p[1]]
}

function parallelogram4th(p1, p2, p3) { return [p1[0] + p3[0] - p2[0], p1[1] + p3[1] - p2[1]] }

/** 位似缩放：P' = c + k*(P-c)，k 为缩放因子 */
function scalePoint(p, c, k) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k] }

/** 两直线交点（直线 AB 与直线 CD 无限延伸求交），平行/共线返回 null */
function lineIntersect(p1, p2, p3, p4) {
  const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1]
  const x3 = p3[0], y3 = p3[1], x4 = p4[0], y4 = p4[1]
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-9) return null
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]
}

// ============================================================
// 点求值引擎
// ============================================================
/** 诊断日志去重：动画每帧都会调用求值，同一问题只告警一次，避免刷屏/刷上报 */
const _warned = new Set()
function warnOnce(key, ...args) {
  if (_warned.has(key)) return
  _warned.add(key)
  console.warn(...args)
}

/** 数值转换：非数字（根式 √3、分数 5/2、表达式等）→ NaN，供调用方告警兜底 */
function toNum(v) {
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

/** 点坐标宽容解析：兼容 {x,y} 独立字段、[x,y] 数组、coords/coordinates/pos/position 字段；根式/非数字坐标告警并兜底 0，避免落到原点 */
function pointXY(p) {
  const pair = (a, b, key) => {
    const x = toNum(a), y = toNum(b)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      warnOnce('coord-nan-' + key, '[animation] fixedPoint 坐标含根式/非数字无法解析:', key, '→', JSON.stringify([a, b]))
      return [Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0]
    }
    return [x, y]
  }
  if (Array.isArray(p)) return pair(p[0], p[1], JSON.stringify(p).slice(0, 40))
  if (!p) return null
  if (p.x !== undefined && p.y !== undefined) return pair(p.x, p.y, p.name || '?')
  const arr = p.coords || p.coordinates || p.pos || p.position || p.point
  if (Array.isArray(arr)) return pair(arr[0], arr[1], p.name || '?')
  warnOnce('coord-' + (p.name || '?'), '[animation] fixedPoint 缺少坐标字段:', p.name || JSON.stringify(p).slice(0, 80))
  return null
}

function resolveCoord(ref, pts) {
  if (Array.isArray(ref)) return [Number(ref[0]), Number(ref[1])]
  if (typeof ref === 'string' && pts[ref]) return pts[ref]
  if (typeof ref === 'string') warnOnce('ref-' + ref, '[animation] 未解析的点引用:', ref)
  return [0, 0]
}

/** 主动点轨迹：滑杆参数值 t → 坐标 */
function trackPosition(track, t, pts) {
  const type = track?.type
  const num = Number(t) || 0
  if (type === 'segment' || type === 'ray' || type === 'line') {
    const start = resolveCoord(track.start ?? track.points?.[0], pts)
    const through = resolveCoord(track.through ?? track.points?.[1], pts)
    const dx = through[0] - start[0], dy = through[1] - start[1]
    const len = Math.hypot(dx, dy) || 1
    return [start[0] + (dx / len) * num, start[1] + (dy / len) * num]
  }
  if (type === 'circle') {
    const c = resolveCoord(track.center, pts)
    const r = Number(track.radius) || 1
    const ang = deg2rad(num)
    return [c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)]
  }
  if (type === 'function') {
    const fn = compileExpr(track.expr)
    if (!fn) return [0, 0]
    return [num, fn(num)]
  }
  return [0, 0]
}

/** 从动点：transform 几何变换 + 已求出的点 */
const TRANSFORM_ALIAS = {
  reflect: 'reflection', flip: 'reflection', mirror: 'reflection', symmetric: 'reflection',
  centralSymmetry: 'reflection', central_symmetry: 'reflection', pointSymmetry: 'reflection', point_symmetry: 'reflection',
  translate: 'translation', shift: 'translation',
  para4th: 'parallelogram',
  dilate: 'scale', homothety: 'scale', homothetic: 'scale',
  rotate_scale: 'scale+rotate',
  right_triangle: 'rightTriangle', isoscelesRight: 'rightTriangle', isosceles_right: 'rightTriangle',
  rightIsosceles: 'rightTriangle', right_isosceles: 'rightTriangle', isosceles_right_triangle: 'rightTriangle',
}
function derivePoint(dep, pts, mainDriver) {
  let t = dep.transform
  if (typeof t === 'string') t = TRANSFORM_ALIAS[t] || t
  const from = dep.from ?? mainDriver
  try {
    if (t === 'rotate') {
      return rotatePoint(resolveCoord(from, pts), resolveCoord(dep.center, pts), Number(dep.angle) || 0)
    }
    if (t === 'reflection' || t === 'reflect' || t === 'flip') {
      const src = resolveCoord(from, pts)
      if (dep.line) return reflectLine(src, resolveCoord(dep.line[0], pts), resolveCoord(dep.line[1], pts))
      // 点对称
      const c = resolveCoord(dep.center, pts)
      return [2 * c[0] - src[0], 2 * c[1] - src[1]]
    }
    if (t === 'translation') {
      const src = resolveCoord(from, pts)
      const v = dep.vector || [0, 0]
      return [src[0] + Number(v[0] || 0), src[1] + Number(v[1] || 0)]
    }
    if (t === 'midpoint') {
      return midpoint(resolveCoord(dep.p1, pts), resolveCoord(dep.p2, pts))
    }
    if (t === 'parallelogram' || t === 'para4th') {
      return parallelogram4th(resolveCoord(dep.p1, pts), resolveCoord(dep.p2, pts), resolveCoord(dep.p3, pts))
    }
    if (t === 'equilateral') {
      const src = resolveCoord(from, pts)
      const center = resolveCoord(dep.center, pts)
      const side = dep.side === 'right' ? -60 : 60
      return rotatePoint(src, center, side)
    }
    // 等腰直角三角形直角顶点：以 line/hypotenuse 两端点为斜边，输出直角顶点 E（∠E=90°，两腰相等）
    // side="right" = 在斜边「a→b」的右手侧（顺时针 90°）；"left" = 逆时针 90°。与 equilateral 的 side 约定一致
    if (t === 'rightTriangle') {
      const hp = dep.line || dep.hypotenuse
      const a = resolveCoord(hp[0], pts)
      const b = resolveCoord(hp[1], pts)
      const m = midpoint(a, b)
      const side = dep.side === 'right' ? -90 : 90
      return rotatePoint(b, m, side)
    }
    if (t === 'scale') {
      return scalePoint(resolveCoord(from, pts), resolveCoord(dep.center, pts), Number(dep.scale) || 1)
    }
    // 交点：两条线（各由两点定义）的直线交点
    if (t === 'intersection' || t === 'intersect') {
      let l1, l2
      if (dep.line1 && dep.line2) {
        l1 = [resolveCoord(dep.line1[0], pts), resolveCoord(dep.line1[1], pts)]
        l2 = [resolveCoord(dep.line2[0], pts), resolveCoord(dep.line2[1], pts)]
      } else if (Array.isArray(dep.points) && dep.points.length >= 2) {
        l1 = [resolveCoord(dep.points[0]?.[0], pts), resolveCoord(dep.points[0]?.[1], pts)]
        l2 = [resolveCoord(dep.points[1]?.[0], pts), resolveCoord(dep.points[1]?.[1], pts)]
      } else if (dep.p1 && dep.p2 && dep.p3 && dep.p4) {
        l1 = [resolveCoord(dep.p1, pts), resolveCoord(dep.p2, pts)]
        l2 = [resolveCoord(dep.p3, pts), resolveCoord(dep.p4, pts)]
      } else if (dep.seg1 && dep.seg2) {
        l1 = [resolveCoord(dep.seg1[0], pts), resolveCoord(dep.seg1[1], pts)]
        l2 = [resolveCoord(dep.seg2[0], pts), resolveCoord(dep.seg2[1], pts)]
      } else {
        return null
      }
      return lineIntersect(l1[0], l1[1], l2[0], l2[1])
    }
    // 旋转+缩放复合（阿氏圆母子相似 / 旋转相似手拉手）：先缩放再绕同一定点旋转
    if (t === 'scale+rotate' || t === 'rotate+scale' || t === 'spiral') {
      const src = resolveCoord(from, pts)
      const center = resolveCoord(dep.center, pts)
      const scaled = scalePoint(src, center, Number(dep.scale) || 1)
      return rotatePoint(scaled, center, Number(dep.angle) || 0)
    }
  } catch (e) { /* skip */ }
  warnOnce('transform-' + (dep?.name || dep?.transform || '?'), '[animation] 无法解析从动点:', dep?.name, 'transform=', dep?.transform)
  return null
}

// 从动点里「非点引用」字段（元信息/数值），做依赖就绪检查时跳过，其余字符串一律视为点引用
const NON_REF_FIELDS = new Set(['name', 'label', 'transform', 'side', 'param', 'unit', 'extremum', 'type'])

/** 检查从动点 dep 引用的所有点是否都已解析出来（pts 里有坐标）。返回 true 表示可计算 */
function depsReady(dep, pts, allNames) {
  const walk = (v) => {
    if (typeof v === 'string') {
      // 是合法点名（fixedPoints/driverPoints/drivenPoints 里定义过）但还没解析出来 → 依赖未就绪
      if (allNames.has(v) && !pts[v]) return false
    } else if (Array.isArray(v)) {
      for (const x of v) if (walk(x) === false) return false
    } else if (v && typeof v === 'object') {
      for (const k in v) if (walk(v[k]) === false) return false
    }
    return true
  }
  for (const k in dep) {
    if (NON_REF_FIELDS.has(k)) continue
    if (walk(dep[k]) === false) return false
  }
  return true
}

/** 计算所有点坐标（给定滑杆参数值） */
function evaluatePoints(scene, paramValues) {
  const pts = {}
  // 收集所有合法点名，用于区分「依赖点还没算出来」vs「AI 自造的虚拟点（如 M0/M1）」
  const allNames = new Set()
  for (const p of scene.fixedPoints || []) { const n = p?.name ?? p?.label; if (n) allNames.add(n) }
  for (const d of scene.driverPoints || []) if (d?.name) allNames.add(d.name)
  for (const d of scene.drivenPoints || []) if (d?.name) allNames.add(d.name)

  for (const p of scene.fixedPoints || []) {
    const xy = pointXY(p)
    const name = p?.name ?? p?.label
    if (xy && name) pts[name] = xy
  }
  const mainDriver = scene.driverPoints?.[0]?.name
  for (const d of scene.driverPoints || []) {
    pts[d.name] = trackPosition(d.track, paramValues[d.param], pts)
  }
  // 从动点：多轮迭代解析（支持链式依赖）。依赖点未就绪时跳过，等下一轮
  const remaining = (scene.drivenPoints || []).slice()
  let guard = Math.max(10, remaining.length * 2)
  while (remaining.length && guard-- > 0) {
    let progressed = false
    for (let i = remaining.length - 1; i >= 0; i--) {
      const dep = remaining[i]
      if (!depsReady(dep, pts, allNames)) continue // 依赖点还没算出来，下一轮再试
      const r = derivePoint(dep, pts, mainDriver)
      if (r) {
        pts[dep.name] = r
        remaining.splice(i, 1)
        progressed = true
      }
    }
    if (!progressed) break // 一轮没有任何进展（引用不存在的点 / 无法解析），避免死循环
  }
  for (const d of remaining) {
    warnOnce('unresolved-' + d?.name, '[animation] 从动点始终无法解析（依赖点未定义或 transform 不支持）:', d?.name, 'transform=', d?.transform)
  }
  return { pts, unresolved: remaining }
}

function segLength(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]) }

// ============================================================
// 最值定位：扫描滑杆参数区间，找目标线段极值
// ============================================================
function locateExtremum(scene, slider, extremum) {
  const min = Number(slider.min ?? 0)
  const max = Number(slider.max ?? 1)
  const N = 200
  let bestT = min
  let bestLen = extremum === 'max' ? -Infinity : Infinity
  const tg = normalizeTarget(scene.segTarget)
  if (!tg) return { t: min, len: 0 }
  for (let i = 0; i <= N; i++) {
    const t = min + (max - min) * (i / N)
    const { pts } = evaluatePoints(scene, { [slider.name]: t })
    const a = resolveCoord(tg.points[0], pts)
    const b = resolveCoord(tg.points[1], pts)
    const len = segLength(a, b)
    if (extremum === 'max' ? len > bestLen : len < bestLen) { bestLen = len; bestT = t }
  }
  return { t: bestT, len: bestLen }
}

/** 规范化 segTarget：支持 ["C","F"] 数组或 {points,extremum,label} 对象 */
function normalizeTarget(segTarget) {
  if (!segTarget) return null
  if (Array.isArray(segTarget)) return { points: segTarget, extremum: 'min', label: segTarget.join('') }
  if (typeof segTarget === 'object') {
    return {
      points: segTarget.points || [],
      extremum: segTarget.extremum || 'min',
      label: segTarget.label || segTarget.id || (segTarget.points ? segTarget.points.join('') : ''),
    }
  }
  return null
}

// ============================================================
// 创建交互动图场景
// ============================================================
export function createAnimationScene(el, scene) {
  const sc = scene || {}

  // ---- UI 配置（开关） ----
  const ui = {
    showSlider: sc.uiConfig?.showSlider ?? true,
    showLocateMin: sc.uiConfig?.showLocateMin ?? true,
    showTrace: sc.uiConfig?.showTrace ?? true,
    showCoordinate: sc.uiConfig?.showCoordinate ?? true,
  }
  const knowledgeTags = sc.knowledgeTags || []

  // ---- 视口 ----
  const vp = sc.viewport || {}
  const hasVp = [vp.xmin, vp.xmax, vp.ymin, vp.ymax].every((v) => v !== undefined)
  const bbox = hasVp
    ? [Number(vp.xmin), Number(vp.ymax), Number(vp.xmax), Number(vp.ymin)]
    : autoBoundingbox(sc)

  const board = JXG.JSXGraph.initBoard(el, {
    boundingbox: bbox,
    axis: true, // 始终创建坐标轴，可见性由 toggleCoordinate 控制（否则初始关闭时无法再开）
    keepAspectRatio: true,
    showCopyright: false,
    showNavigation: false,
    zoom: { wheel: true },
    pan: { enabled: true, needTwoFingers: false },
  })

  // 初始关闭坐标系时，创建后立即隐藏
  if (!ui.showCoordinate) {
    if (board.defaultAxes?.x) board.defaultAxes.x.setAttribute({ visible: false })
    if (board.defaultAxes?.y) board.defaultAxes.y.setAttribute({ visible: false })
  }

  // ---- 缩放（滑轨）/ 平移 / 全屏适配 ----
  const bboxCx = (bbox[0] + bbox[2]) / 2
  const bboxCy = (bbox[1] + bbox[3]) / 2
  const bboxW = Math.abs(bbox[2] - bbox[0]) || 10
  const bboxH = Math.abs(bbox[1] - bbox[3]) || 10
  let zoomLevel = 1

  function setZoom(z) {
    zoomLevel = Math.max(0.2, Math.min(8, Number(z) || 1))
    const w = bboxW / zoomLevel
    const h = bboxH / zoomLevel
    board.setBoundingBox([bboxCx - w / 2, bboxCy + h / 2, bboxCx + w / 2, bboxCy - h / 2], true)
  }

  function resize() {
    try {
      const w = el.clientWidth || el.parentElement?.clientWidth || 600
      const h = el.clientHeight || el.parentElement?.clientHeight || 440
      if (w > 0 && h > 0 && board.resizeContainer) board.resizeContainer(w, h, false)
    } catch (e) { /* skip */ }
  }

  // ---- 滑杆：从 driverPoints 推导 ----
  const sliders = (sc.driverPoints || []).map((d) => ({
    name: d.param,
    min: Number(d.range?.[0] ?? 0),
    max: Number(d.range?.[1] ?? 1),
    step: Number(d.step ?? ((Number(d.range?.[1] ?? 1) - Number(d.range?.[0] ?? 0)) / 100)),
    unit: d.unit || '',
  }))
  const paramValues = {}
  for (const s of sliders) paramValues[s.name] = s.min

  // ---- 颜色约定 ----
  const COLOR_FIXED = '#000000'
  const COLOR_DRIVER = '#0ea5e9'
  const COLOR_DEP = '#ef4444'
  const COLOR_TARGET = '#16a34a'
  const COLOR_AUX = '#f97316'
  const COLOR_FILL = '#fff2cc'

  // ---- 创建点对象 ----
  const pointObjs = {}
  function ensurePoint(name, color, isFixed, label) {
    const p = board.create('point', [0, 0], {
      name: label || name,
      fixed: true, // 所有点不可手动拖，画布空白区拖动用于平移视图
      size: isFixed ? 3 : 4,
      color,
      face: isFixed ? 'o' : '[]',
      label: { fontSize: 14, color },
      withLabel: true,
    })
    pointObjs[name] = p
    return p
  }
  for (const p of sc.fixedPoints || []) ensurePoint(p.name, COLOR_FIXED, true, p.label || p.name)
  for (const d of sc.driverPoints || []) ensurePoint(d.name, COLOR_DRIVER, false, d.label || d.name)
  for (const d of sc.drivenPoints || []) ensurePoint(d.name, COLOR_DEP, false, d.label || d.name)

  // ---- 几何元素 ----
  const shapeObjs = []
  const auxObjs = []

  function pointRef(ref) { return typeof ref === 'string' && pointObjs[ref] ? pointObjs[ref] : null }
  function pointRefOrArray(ref) {
    if (typeof ref === 'string' && pointObjs[ref]) return pointObjs[ref]
    if (Array.isArray(ref)) return [Number(ref[0]), Number(ref[1])]
    return [0, 0]
  }
  function createSegment(p1, p2, opts) {
    return board.create('segment', [pointRefOrArray(p1), pointRefOrArray(p2)], opts)
  }

  // 主图形
  for (const s of sc.shapes || []) {
    try {
      if (s.type === 'polygon' || s.type === 'triangle' || s.type === 'quad') {
        const verts = (s.points || []).map(pointRefOrArray)
        if (verts.length >= 3) {
          shapeObjs.push(board.create('polygon', verts, {
            borders: { strokeColor: s.strokeColor || '#334155', strokeWidth: s.borderWidth || 1.5 },
            fillColor: s.fill ? (s.fillColor || COLOR_FILL) : 'none',
            fillOpacity: 1,
            highlight: false,
            hasInnerPoints: false,
          }))
        }
      } else if (s.type === 'segment') {
        shapeObjs.push(createSegment(s.points?.[0], s.points?.[1], {
          strokeColor: s.strokeColor || '#334155',
          strokeWidth: s.strokeWidth || 2,
          dash: s.dash || 0,
        }))
      } else if (s.type === 'line') {
        shapeObjs.push(board.create('line', [pointRefOrArray(s.points?.[0]), pointRefOrArray(s.points?.[1])], {
          strokeColor: s.strokeColor || '#334155',
          strokeWidth: s.strokeWidth || 2,
          dash: s.dash || 0,
        }))
      } else if (s.type === 'ray') {
        shapeObjs.push(board.create('segment', [pointRefOrArray(s.points?.[0]), pointRefOrArray(s.points?.[1])], {
          strokeColor: s.strokeColor || '#334155',
          strokeWidth: s.strokeWidth || 2,
          dash: s.dash || 0,
          lastArrow: true,
        }))
      } else if (s.type === 'circle') {
        board.create('circle', [pointRefOrArray(s.center), Number(s.radius) || 1], {
          strokeColor: s.strokeColor || '#334155', strokeWidth: 2,
        })
      } else if (s.type === 'function') {
        const fn = compileExpr(s.expr)
        if (fn) board.create('functiongraph', [fn, Number(s.xmin ?? bbox[0]), Number(s.xmax ?? bbox[2])], {
          strokeColor: '#0ea5e9', strokeWidth: 2,
        })
      }
    } catch (e) { /* skip */ }
  }

  // 目标线段（绿色高亮）
  let tg = normalizeTarget(sc.segTarget)
  // 校验目标点：必须是已定义的点名或坐标数组。AI 自造虚拟点（如 M0/M1）不在 pointObjs 里，
  // 若放行会被兜底成 [0,0] 画到原点，产生垃圾绿线
  if (tg && tg.points.some((p) => typeof p === 'string' && !pointObjs[p])) {
    warnOnce('segTarget-bad-ref-' + JSON.stringify(tg.points), '[animation] segTarget 引用了未定义的点（AI 自造虚拟点，如 M0/M1），已跳过目标线段:', JSON.stringify(tg.points))
    tg = null
  }
  let targetLabelObj = null
  if (tg && tg.points.length >= 2) {
    createSegment(tg.points[0], tg.points[1], {
      strokeColor: COLOR_TARGET, strokeWidth: 3, name: tg.label,
      label: { color: COLOR_TARGET, fontSize: 15 },
    })
  }

  // 辅助线（橙色虚线，可开关）
  for (const a of sc.auxLines || []) {
    try {
      const seg = createSegment(a.points?.[0], a.points?.[1], {
        strokeColor: COLOR_AUX, strokeWidth: 1.5, dash: 2,
        visible: a.visible !== false,
      })
      auxObjs.push({ obj: seg })
    } catch (e) { /* skip */ }
  }

  // ---- 轨迹 ----
  const traceNames = sc.trace || (sc.drivenPoints || []).map((d) => d.name)
  const traceCurves = {}
  const traceData = {}
  for (const name of traceNames) {
    traceData[name] = { xs: [], ys: [] }
    traceCurves[name] = board.create('curve', [[], []], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 3 })
  }

  // ---- 动画状态 ----
  const anim = sc.animation || {}
  const duration = Math.max(0.5, Number(anim.duration) || 5)
  const loop = anim.loop !== false
  const mainSlider = sliders[0] || { name: 't', min: 0, max: 1 }

  let rafId = null
  let startTs = null
  let speed = 1
  let running = false
  let showTrace = ui.showTrace
  const tickListeners = []

  function currentParam() { return paramValues[mainSlider.name] ?? mainSlider.min }

  function setParam(name, value) {
    const s = sliders.find((x) => x.name === name) || mainSlider
    paramValues[name] = Math.max(s.min, Math.min(s.max, Number(value)))
    applyFrame()
  }

  function applyFrame() {
    const { pts } = evaluatePoints(sc, paramValues)

    for (const id in pts) {
      const po = pointObjs[id]
      if (po) po.moveTo([pts[id][0], pts[id][1]])
    }

    if (showTrace) {
      for (const name in traceData) {
        if (pts[name]) {
          const d = traceData[name]
          d.xs.push(pts[name][0]); d.ys.push(pts[name][1])
          if (d.xs.length > 2000) { d.xs.shift(); d.ys.shift() }
          traceCurves[name].dataX = d.xs.slice()
          traceCurves[name].dataY = d.ys.slice()
        }
      }
    }

    updateTargetLabel(pts)
    board.update()

    let tgLen = null
    if (tg && tg.points.length >= 2 && pts[tg.points[0]] && pts[tg.points[1]]) {
      tgLen = segLength(pts[tg.points[0]], pts[tg.points[1]])
    }
    tickListeners.forEach((cb) => cb({ params: { ...paramValues }, targetLength: tgLen, pts }))
  }

  function updateTargetLabel(pts) {
    if (!tg || !tg.showLabel) return
    const a = pts[tg.points[0]], b = pts[tg.points[1]]
    if (!a || !b) return
    const len = segLength(a, b)
    if (!targetLabelObj) targetLabelObj = board.create('text', [a[0], a[1], ''], { color: COLOR_TARGET, fontSize: 15 })
    targetLabelObj.setText(`${tg.label} = ${len.toFixed(2)}`)
    targetLabelObj.moveTo([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])
  }

  function progress(sec) {
    const total = mainSlider.max - mainSlider.min
    if (loop) {
      const p = sec % (duration * 2)
      const ratio = p <= duration ? p / duration : 2 - p / duration
      return mainSlider.min + ratio * total
    }
    return mainSlider.min + Math.min((sec / duration) % 1, 1) * total
  }

  function frame(now) {
    if (!running) return
    const sec = ((now - startTs) / 1000) * speed
    paramValues[mainSlider.name] = progress(sec)
    applyFrame()
    rafId = requestAnimationFrame(frame)
  }

  function play() {
    if (running) return
    if (!loop && currentParam() >= mainSlider.max) paramValues[mainSlider.name] = mainSlider.min
    running = true
    const span = mainSlider.max - mainSlider.min || 1
    startTs = performance.now() - (currentParam() - mainSlider.min) / span * duration * 1000 / speed
    rafId = requestAnimationFrame(frame)
  }
  function pause() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null } }
  function stop() { pause(); paramValues[mainSlider.name] = mainSlider.min; applyFrame() }
  function setSpeed(mult) { speed = Math.max(0.25, mult); if (running) startTs = performance.now() }

  function locate() {
    const extremum = tg?.extremum === 'max' ? 'max' : 'min'
    const res = locateExtremum(sc, mainSlider, extremum)
    paramValues[mainSlider.name] = res.t
    applyFrame()
    return res
  }

  function clearTrace() {
    for (const name in traceData) { traceData[name] = { xs: [], ys: [] } }
    for (const name in traceCurves) { traceCurves[name].dataX = []; traceCurves[name].dataY = [] }
    board.update()
  }
  function toggleTrace(show) { showTrace = show !== false; if (!showTrace) clearTrace() }
  function toggleAuxiliary(show) {
    auxObjs.forEach(({ obj }) => { if (obj && obj.setAttribute) obj.setAttribute({ visible: show !== false }) })
    board.update()
  }
  function toggleCoordinate(show) {
    const visible = show !== false
    if (board.defaultAxes?.x) board.defaultAxes.x.setAttribute({ visible })
    if (board.defaultAxes?.y) board.defaultAxes.y.setAttribute({ visible })
    board.update()
  }

  function destroy() {
    pause()
    tickListeners.length = 0
    JXG.JSXGraph.freeBoard(board)
  }

  applyFrame()

  return {
    board,
    ui, knowledgeTags,
    setParam, getParam: (name) => paramValues[name] ?? currentParam(),
    play, pause, stop, setSpeed,
    locate, clearTrace, toggleTrace, toggleAuxiliary, toggleCoordinate,
    onTick(cb) { tickListeners.push(cb) },
    getTargetLength: () => {
      const { pts } = evaluatePoints(sc, paramValues)
      if (!tg || tg.points.length < 2) return null
      return segLength(resolveCoord(tg.points[0], pts), resolveCoord(tg.points[1], pts))
    },
    getSliders: () => sliders,
    getTargetLabel: () => tg?.label || '',
    getExtremum: () => tg?.extremum || 'min',
    setZoom, getZoom: () => zoomLevel, resize,
    destroy,
  }
}

function autoBoundingbox(scene) {
  let xs = [], ys = []
  const push = (p) => {
    if (p && p.x !== undefined) { xs.push(Number(p.x)); ys.push(Number(p.y)) }
  }
  for (const p of scene.fixedPoints || []) push(p)
  if (!xs.length) return [-5, 5, 5, -5]
  let xmin = Math.min(...xs), xmax = Math.max(...xs)
  let ymin = Math.min(...ys), ymax = Math.max(...ys)
  const w = xmax - xmin || 10, h = ymax - ymin || 10
  const padX = w * 0.15, padY = h * 0.15
  return [xmin - padX, ymax + padY, xmax + padX, ymin - padY]
}
