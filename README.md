# 🌱 小芽专注 (Sproutly)

儿童学习专注计时应用。每一次 25 分钟专注，都是一次给学习习惯浇水的小成长。

**线上地址**：[https://sproutly.digitalvio.shop](https://sproutly.digitalvio.shop)

---

## 功能特性

- **番茄计时器**：25 分钟专注 + 5 分钟短休息 + 15 分钟长休息（每 4 次专注后）
- **今日任务清单**：添加、编辑、完成、删除任务，支持 emoji 和预估番茄数
- **今日动态**：记录每次专注的开始、完成、放弃，显示数据库同步状态
- **奖励系统**：每完成 4 次专注解锁一个贴纸，积累星星
- **跨设备同步**：登录后任务、星星、贴纸自动同步到云端
- **提示音**：专注结束播放上行琶音，休息结束播放轻柔铃声
- **暗色主题**：支持深色界面

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite + Tailwind CSS |
| 后端 | Node.js + Express |
| 数据库 | PostgreSQL |
| 部署 | Nginx + PM2 |
| 认证 | JWT |

---

## 本地开发

### 前置要求

- Node.js 18+
- PostgreSQL

### 启动前端

```bash
npm install
npm run dev
```

### 启动后端

```bash
cd backend
npm install
cp .env.example .env   # 填写数据库和 JWT 配置
node src/migrate.js    # 初始化数据库表
npm run dev
```

### 环境变量

**前端**（`.env.local`）：
```
VITE_API_URL=http://localhost:3001/api
```

**后端**（`backend/.env`）：
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sproutly
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=30d
INVITE_CODE=SPROUT2026
```

---

## 邀请码

注册账号需要邀请码，默认为：**`SPROUT2026`**

可通过后端环境变量 `INVITE_CODE` 自定义。

---

## 数据库结构

| 表名 | 说明 |
|------|------|
| `users` | 用户账号 |
| `pomodoro_sessions` | 每次计时记录（完成/放弃） |
| `tasks` | 今日任务 |
| `stickers` | 获得的贴纸 |
| `interruptions` | 打断记录 |
| `user_state` | 跨设备同步状态（星星、贴纸、番茄数） |

---

## 部署

```bash
# 构建前端
npm run build

# 上传到服务器
rsync -avz dist/ user@server:/var/www/sproutly/

# 后端用 PM2 管理
pm2 start backend/src/server.js --name sproutly-backend
```

Nginx 配置：前端静态文件 + `/api/` 反向代理到后端 3001 端口。
