# Northstar SaaS 管理平台面试项目

English: [`README.en.md`](README.en.md)

面向 Junior 全栈工程师的本地 Vibe Coding 面试项目。前端、API 和 PostgreSQL 数据库都在本地运行，不依赖外部服务账号或密钥。

## 环境要求

- Git、互联网连接和现代浏览器（建议 Chrome、Edge 或 Firefox）
- macOS、Windows PowerShell 或使用 glibc 的 Linux（x64/ARM64）
- Docker Desktop（用于启动本地 PostgreSQL）
- 不需要预先安装 Node.js/npm：首次启动会把 Node.js 24.22.3 下载到本 repo 的 `.tools/`，校验官方 SHA-256，再安装锁定的 npm 依赖。不会修改系统级安装。

首次依赖安装需要互联网，可能需要几分钟；建议面试前 clone 并启动一次，不计入 30–40 分钟面试时间。若所在网络无法下载，可手动安装 [Node.js 24.x](https://nodejs.org/en/download) 后使用常规 npm 命令。

## 本地启动

macOS/Linux：

```bash
./scripts/start-interview.sh
```

Windows PowerShell：

```powershell
.\scripts\start-interview.ps1
```

打开 <http://127.0.0.1:5173/>；API 健康检查为 <http://127.0.0.1:3001/api/health>。启动脚本会通过 Docker Compose 启动 PostgreSQL。按 `Ctrl+C` 停止前后端；数据库容器继续运行，数据保存在 Docker volume 中。依赖仅在首次运行或 `package-lock.json` 改变时安装；之后启动不会重置数据库。

面试官开始每位候选人面试前，在已经启动过一次的 repo 中显式运行 `./scripts/npm.sh run db:reset`（Windows PowerShell: `./scripts/npm.ps1 run db:reset`），再启动项目。此命令会重置本地 PostgreSQL 演示数据库。使用 `./scripts/npm.sh run db:stop` 可停止并移除容器；数据 volume 会保留。

- 前端：<http://127.0.0.1:5173>
- API 健康检查：<http://127.0.0.1:3001/api/health>

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
./scripts/npm.sh test                  # 起始代码已有行为，应该通过
./scripts/npm.sh run test:challenge    # 第一阶段前端搜索验收测试，起始时会失败
./scripts/npm.sh run typecheck
./scripts/npm.sh run build
./scripts/npm.sh run db:inspect        # 只读查看 PostgreSQL 中的租户状态
```

Windows PowerShell 将 `./scripts/npm.sh` 替换为 `./scripts/npm.ps1`。这些包装脚本使用首次启动时下载的本地 Node/npm，不要求另开终端设置 PATH。

候选人会在面试中逐阶段收到需求说明。第一阶段是一个前端搜索 bug 修复；后续阶段的需求由面试官按进度单独发送。

## 题目

通用规则见中文 [`docs/interview/candidate-prompt.md`](docs/interview/candidate-prompt.md) 和英文 [`docs/interview/candidate-prompt.en.md`](docs/interview/candidate-prompt.en.md)。面试官会另外分阶段发送需求说明；候选人初始拿到的 repo 不包含第二、三阶段题目。启动项目后可用 `./scripts/npm.sh run test:challenge`（Windows: `./scripts/npm.ps1 run test:challenge`）运行第一阶段验收测试。

本地可执行 Vercel CLI 指令时，建议安装 `npm i -g vercel`，可使用 `vercel env pull`、`vercel deploy` 和 `vercel logs` 等工作流；本面试项目本地运行不需要 CLI 或部署。
