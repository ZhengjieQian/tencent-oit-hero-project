# Northstar SaaS 管理平台面试项目

English: [`README.en.md`](README.en.md)

面向 Junior 全栈工程师的本地 Vibe Coding 面试项目。前端、API 和 SQLite 种子数据都在本地运行，不依赖外部服务账号或密钥。

## 环境要求

- Node.js 22.12.x 或 24.x（本 repo 依赖当前 Vite/jsdom 支持的 Node LTS 版本）
- npm 10 或更新版本

若尚未安装 Node.js，请从[官方 Node.js 下载页](https://nodejs.org/en/download)安装 24.x（或 22.12.x 及以上的 22.x）；安装 Node.js 时会一并安装 npm。安装后重新打开终端，确认：

```bash
node --version
npm --version
```

建议在面试前完成安装并按下方步骤启动项目。不要把安装环境计入 30–40 分钟面试时间。

## 本地启动

```bash
npm install
npm run db:reset
npm run dev
```

- 前端：<http://localhost:5173>
- API 健康检查：<http://localhost:3001/api/health>

应用默认使用平台运营身份。通过 **Demo identity** 选择器切换预置账号：

| 账号 | 角色 | 租户 |
|---|---|---|
| `ops@northstar.example` | 平台运营 | 全平台 |
| `admin@acme.example` | 租户管理员 | Acme Studio |
| `admin@globex.example` | 租户管理员 | Globex Labs |
| `member@acme.example` | 普通成员 | Acme Studio |

身份选择器仅用于本地面试演练。生产环境会关闭 demo session API；不要将此认证方案用于线上服务。

## 检查命令

```bash
npm test                 # 起始代码已有行为，应该通过
npm run test:challenge   # 第一阶段前端搜索验收测试，起始时会失败
npm run typecheck
npm run build
npm run db:inspect       # 只读查看 SQLite 中的租户状态
```

候选人会在面试中逐阶段收到需求说明。第一阶段是一个前端搜索 bug 修复；后续阶段的需求由面试官按进度单独发送。

## 题目

通用规则见中文 [`docs/interview/candidate-prompt.md`](docs/interview/candidate-prompt.md) 和英文 [`docs/interview/candidate-prompt.en.md`](docs/interview/candidate-prompt.en.md)。面试官会另外分阶段发送需求说明；候选人初始拿到的 repo 不包含第二、三阶段题目。

本地可执行 Vercel CLI 指令时，建议安装 `npm i -g vercel`，可使用 `vercel env pull`、`vercel deploy` 和 `vercel logs` 等工作流；本面试项目本地运行不需要 CLI 或部署。
