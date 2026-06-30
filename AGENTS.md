# EduAI — 项目上下文

> 前后端分离开发，此文件为共享上下文。  
> 前端 Claude（VS Code `c:\Users\86151\Desktop\mycode`）维护前端  
> 后端 Claude（IDEA `D:\soft\Icode\EduAI-server`）维护后端  
> **每次更新上下文请同步此文件到两边**

---

## 一、项目是什么

**全学科 AI 智能教育平台**。覆盖 9 大学科的在线教育系统。

| 学科 | 英语 | 语文 | 数学 | 物理 | 化学 | 生物 | 历史 | 政治 | 地理 |
|------|------|------|------|------|------|------|------|------|------|

- 前端：Vue 3 + Element Plus + Pinia + Vite（VS Code）
- 后端：Spring Boot 3.4.5 + JDK 21 + Maven 多模块（IDEA）
- 仓库：`https://github.com/KHere-Z/EduAI`
- 分支：`dev/20260630`（今日日期）→ 用户决定是否合并到 `main`

## 二、当前进度（7 步流程）

| # | 步骤 | 负责人 | 状态 |
|---|------|--------|------|
| ① | 需求文档 & 技术栈 | 已完成 | ✅ |
| ② | 项目架构设计 | 已完成 | ✅ |
| ③ | 页面设计 & 前端编写 | 前端 | ✅ 完成 |
| ④ | 数据库设计与建立 | 后端 | ⬅️ **当前** |
| ⑤ | 后端接口开发 | 后端 | ⏳ |
| ⑥ | 配置 AI 服务 | 后端 | ⏳ |
| ⑦ | 部署上线 | 联合 | ⏳ |

## 三、项目结构

```
KHere-Z/EduAI/
├── web/                     ← 前端：Vue 3 SPA
│   ├── src/
│   │   ├── views/
│   │   │   ├── coach/       ← 教练端 (课堂/学科/词汇/AI)
│   │   │   ├── agency/      ← 机构端 (学员/排课/CRM)
│   │   │   ├── platform/    ← 平台端 (机构/词库管理)
│   │   │   ├── login/       ← 登录注册
│   │   │   └── home/        ← 首页
│   │   ├── layouts/         ← 4套角色布局
│   │   ├── router/          ← Vue Router
│   │   ├── store/           ← Pinia
│   │   └── api/             ← Axios 封装
│   └── vite.config.js
├── server/                  ← 后端：IDEA 独立项目
│   ├── pom.xml              ← Spring Boot 父POM
│   ├── eduai-system/        ← 启动模块
│   ├── eduai-common/        ← 工具类
│   ├── eduai-security/      ← Sa-Token 认证
│   ├── eduai-ai/            ← DeepSeek 客户端
│   ├── eduai-statistics/    ← 成绩统计
│   ├── eduai-file/          ← 文件/OCR
│   └── eduai-subject-{领域}/← 9学科模块
├── docs/spec/               ← 需求/架构文档
│   ├── 01-requirements.md
│   └── 02-architecture.md
└── AGENTS.md                ← [本文件] 共享上下文
```

## 四、用户角色

| 角色 | 标识 | 路由前缀 |
|------|------|----------|
| 平台管理员 | `admin` | `/admin` |
| 教师 | `teacher` | `/teacher` |
| 学生 | `student` | `/student` |

测试账号：`coach/coach123` `agency/agency123` `admin/admin123`

## 五、每个学科 9 个通用功能

```
All subjects have:
  WrongQuestions · WrongAnalysis · KnowledgePoints · ExamPoints
  SolutionModels · QuestionBank · AIFeedback · AIAnalysis · ScoreStats
```

API 格式：`/api/v1/{subject}/{feature}`
认证格式：`Authorization: Bearer <token>`
响应格式：`{ code: 200, message: "success", data: {...} }`

## 六、英语学科特殊处理

参照 `airunword.com` 架构，**移除蓝思值（Lexile）**。
保留：课堂/词汇测试/词汇记忆/核心词汇/AI阅读/AI口语/语法/深度阅读/造句/阅读课堂/学习反馈

## 七、前后端约定

| 约定 | 值 |
|------|-----|
| 前端端口 | `localhost:5173` |
| 后端端口 | `localhost:8080` |
| API 前缀 | `/api/v1/` |
| 认证方式 | `Authorization: Bearer <token>` (Header) |
| 响应格式 | `{ code: 200, message: "success", data: {...} }` |
| 分页参数 | `?page=1&pageSize=20` |
| 分页响应 | `{ list: [...], total: 156, page: 1, pageSize: 20 }` |
| 跨域 | 后端已配置 CORS |
| 学科参数 | URL 路径参数 `:subject`，值：english/chinese/math/physics/chemistry/biology/history/politics/geography |

## 八、关键架构决策

1. **动态学科路由**：前端用 `/coach/subject/:subject/*` 一个路由渲染 9 学科，避免 9×9=81 个页面
2. **学科通用模板**：后端 `eduai-subject-common` 提供 CRUD 基类，9 学科模块继承复用
3. **前后端分离**：VS Code 只有 `web/`，IDEA 只有 `server/`，物理隔离

---

> 📝 **更新记录**  
> 2026-06-30 (上午): ①②步完成  
> 2026-06-30 (下午): ③前端完成 — 设计系统 + 登录页 + Dashboard + 9学科动态路由 + 9功能页面，接口文档交付 → 进入④数据库设计
