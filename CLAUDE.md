# EduAI - AI 教育系统

AI 驱动的在线教育 Web 平台。

## 仓库信息

- 仓库：https://github.com/KHere-Z/EduAI
- 主分支：`main`
- 工作分支命名：`dev/YYYYMMDD`（按日期创建）
- 每天工作完成后由开发者决定是否合并到 main

## 工作流程

1. 每天开始工作时创建 `dev/YYYYMMDD` 分支
2. 所有修改在该分支上进行
3. 完成功能并测试通过后，**由用户决定**是否合并到 main
4. 合并到 main 后推送到 origin

## 分支规则

- `main`：稳定版本，只接受合并，不直接提交
- `dev/*`：每日开发分支，可自由提交

## 技术栈（待确定）

## 开发规范

- 遵循 agent-skills 工程规范
- 使用 `/spec` 定义功能，`/plan` 分解任务，`/build` 增量实现
- 每个功能模块需包含测试
