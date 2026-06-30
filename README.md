# EduAI - AI 智能英语学习平台

基于 [阅读云英语](https://www.airunword.com/) 架构的 AI 驱动智能英语学习系统。

## 📋 项目结构

```
EduAI/
├── web/                    # 前端（Vue 3 + Element Plus + Vite）
│   ├── src/
│   │   ├── views/
│   │   │   ├── coach/      # 教练端（课堂/词汇/阅读/AI工具）
│   │   │   ├── agency/     # 机构端（学员/排课/CRM/报表）
│   │   │   └── platform/   # 平台端（机构管理/词库/书库）
│   │   ├── layouts/        # 布局组件
│   │   ├── router/         # Vue Router
│   │   ├── store/          # Pinia 状态管理
│   │   └── api/            # API 服务层
│   └── vite.config.js
├── server/                 # 后端（Express + JWT）
│   └── src/
│       ├── routes/         # API 路由（auth/students/words/classes）
│       └── middleware/      # JWT 认证中间件
└── CLAUDE.md              # AI Agent 配置
```

## 🚀 快速启动

### 前端
```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

### 后端
```bash
cd server
npm install
node index.js        # http://localhost:3000
```

## 🔑 测试账号

| 角色 | 用户名 | 密码 | 路由 |
|------|--------|------|------|
| 教练 | coach | coach123 | /coach/dashboard |
| 机构 | agency | agency123 | /agency/dashboard |
| 平台 | admin | admin123 | /platform/dashboard |

## 🛠️ 技术栈

- **前端**: Vue 3 + Element Plus + Pinia + Vue Router + Vite
- **后端**: Express.js + JWT 认证
- **目标 AI 集成**: Agent Skills 工程规范
