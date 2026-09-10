import zhCn from 'element-plus/es/locale/lang/zh-cn'

// Element Plus 中文语言包 + 项目自定义文案。
// 通过 <el-config-provider :locale="..."> 注入，全局生效（分页、日期选择器等）。
export default {
  ...zhCn,
  el: {
    ...zhCn.el,
    pagination: {
      ...zhCn.el.pagination,
      total: '总共 {total} 条',
    },
  },
}
