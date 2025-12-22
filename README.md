# Anki 学习追踪器

一个用于追踪每日 Anki 学习统计数据的 Web 应用，支持多用户认证和云端数据同步。

## 演示

![Demo](demo.gif)

## 项目架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户浏览器                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        前端应用 (静态文件)                              │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │config.js│ │ auth.js │ │ data.js │ │  ui.js  │ │charts.js│         │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └─────────┘ └─────────┘         │  │
│  │       │           │           │                                       │  │
│  │       └───────────┴───────────┴──────────────┐                       │  │
│  │                                              ▼                       │  │
│  │                              ┌──────────────────────────┐            │  │
│  │                              │   Supabase JS Client     │            │  │
│  │                              │   (CDN: supabase-js@2)   │            │  │
│  │                              └────────────┬─────────────┘            │  │
│  └───────────────────────────────────────────┼──────────────────────────┘  │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               │ HTTPS
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Supabase 云服务                                 │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │      Authentication         │    │           PostgreSQL                │ │
│  │  ┌───────────────────────┐  │    │  ┌───────────────────────────────┐  │ │
│  │  │ Email/Password Auth   │  │    │  │      anki_records 表          │  │ │
│  │  ├───────────────────────┤  │    │  │  ─────────────────────────── │  │ │
│  │  │ Google OAuth Provider │──┼────┼──│  id, user_id, date, cards,   │  │ │
│  │  ├───────────────────────┤  │    │  │  duration, avg_seconds,      │  │ │
│  │  │ GitHub OAuth Provider │  │    │  │  retry_count, retry_percent, │  │ │
│  │  └───────────────────────┘  │    │  │  learn, review, relearn,     │  │ │
│  └─────────────────────────────┘    │  │  filtered, created_at        │  │ │
│                                      │  └───────────────────────────────┘  │ │
│                                      │                                     │ │
│                                      │  ┌───────────────────────────────┐  │ │
│                                      │  │   Row Level Security (RLS)   │  │ │
│                                      │  │   auth.uid() = user_id       │  │ │
│                                      │  └───────────────────────────────┘  │ │
│                                      └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              部署架构                                        │
│                                                                             │
│   GitHub Repository ──(push)──▶ Vercel ──(auto deploy)──▶ 静态网站托管      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 数据流向

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           认证流程                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Email/Password 登录                                                  │
│     浏览器 ──POST──▶ Supabase Auth ──▶ 返回 JWT Token ──▶ 存储到浏览器   │
│                                                                          │
│  2. OAuth 登录 (Google/GitHub)                                           │
│     浏览器 ──重定向──▶ Google/GitHub ──授权──▶ Supabase ──▶ 重定向回应用  │
│                         ▲                          │                     │
│                         │                          ▼                     │
│                    用户授权页面              生成 JWT Token               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                           数据操作流程                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  读取数据:                                                                │
│  浏览器 ──GET + JWT──▶ Supabase API ──RLS过滤──▶ 返回当前用户数据        │
│                                                                          │
│  写入数据:                                                                │
│  浏览器 ──POST + JWT + user_id──▶ Supabase API ──RLS验证──▶ 插入/更新    │
│                                                                          │
│  删除数据:                                                                │
│  浏览器 ──DELETE + JWT──▶ Supabase API ──RLS验证──▶ 删除记录             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 数据结构

### 请求/响应格式

```javascript
// 保存记录 - 请求体
{
  "user_id": "uuid-of-current-user",
  "date": "2025-12-22",
  "duration": 83.38,
  "cards": 328,
  "avg_seconds": 15.25,
  "retry_count": 121,
  "retry_percent": 36.89,
  "learn": 182,
  "review": 84,
  "relearn": 62,
  "filtered": 0
}

// 加载数据 - 响应体
[
  {
    "id": "record-uuid",
    "user_id": "user-uuid",
    "date": "2025-12-22",
    "duration": 83.38,
    "cards": 328,
    "avg_seconds": 15.25,
    "retry_count": 121,
    "retry_percent": 36.89,
    "learn": 182,
    "review": 84,
    "relearn": 62,
    "filtered": 0,
    "created_at": "2025-12-22T10:30:00Z"
  }
]

// 前端缓存格式 (dataCache)
{
  "2025-12-22": {
    "duration": 83.38,
    "cards": 328,
    "avgSeconds": 15.25,
    "retryCount": 121,
    "retryPercent": 36.89,
    "learn": 182,
    "review": 84,
    "relearn": 62,
    "filtered": 0
  }
}
```

---

## 部署配置指南

### 1. Supabase 配置

#### 1.1 创建项目

1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: anki-tracker (或自定义名称)
   - **Database Password**: 设置强密码
   - **Region**: 选择离你最近的区域
4. 点击 "Create new project"，等待约2分钟

#### 1.2 获取 API 密钥

1. 进入项目 Dashboard
2. 点击左侧 **Settings** → **API**
3. 复制以下信息：
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

4. 将这些值填入 `js/config.js`:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

#### 1.3 创建数据库表

1. 进入 **SQL Editor**
2. 运行以下 SQL:

```sql
-- 创建 anki_records 表
CREATE TABLE anki_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    duration DECIMAL(10,2),
    cards INTEGER,
    avg_seconds DECIMAL(10,2),
    retry_count INTEGER,
    retry_percent DECIMAL(5,2),
    learn INTEGER,
    review INTEGER,
    relearn INTEGER,
    filtered INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- 启用 Row Level Security
ALTER TABLE anki_records ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own records" ON anki_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON anki_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON anki_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON anki_records
    FOR DELETE USING (auth.uid() = user_id);

-- 创建索引提高查询性能
CREATE INDEX idx_anki_records_user_date ON anki_records(user_id, date);
```

#### 1.4 配置 Email 认证

1. 进入 **Authentication** → **Providers** → **Email**
2. 确保 Email 已启用
3. **开发阶段**: 关闭 "Confirm email"（否则需要配置 SMTP）
4. **生产环境**: 配置 SMTP 发送确认邮件

#### 1.5 配置 Google OAuth

1. 进入 **Authentication** → **Providers** → **Google**
2. 开启 Google 登录
3. 需要先在 Google Cloud Console 配置:

##### Google Cloud Console 配置:

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 进入 **APIs & Services** → **OAuth consent screen**
   - User Type: External
   - App name: Anki Tracker
   - User support email: 你的邮箱
   - Developer contact: 你的邮箱
4. 进入 **APIs & Services** → **Credentials**
5. 点击 **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: Anki Tracker
   - Authorized JavaScript origins:
     ```
     https://your-project.vercel.app
     http://localhost:3000 (本地开发)
     ```
   - Authorized redirect URIs:
     ```
     https://your-supabase-project.supabase.co/auth/v1/callback
     ```
6. 复制 **Client ID** 和 **Client Secret**
7. 回到 Supabase，填入 Google Provider 配置

#### 1.6 配置 GitHub OAuth

1. 进入 **Authentication** → **Providers** → **GitHub**
2. 开启 GitHub 登录

##### GitHub 配置:

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **New OAuth App**
3. 填写信息:
   - **Application name**: Anki Tracker
   - **Homepage URL**: `https://your-project.vercel.app`
   - **Authorization callback URL**:
     ```
     https://your-supabase-project.supabase.co/auth/v1/callback
     ```
4. 点击 **Register application**
5. 复制 **Client ID**，点击 **Generate a new client secret** 获取 Secret
6. 回到 Supabase，填入 GitHub Provider 配置

#### 1.7 配置 Redirect URL

1. 进入 **Authentication** → **URL Configuration**
2. 设置 **Site URL**: `https://your-project.vercel.app`
3. 添加 **Redirect URLs**:
   ```
   https://your-project.vercel.app
   https://your-project.vercel.app/
   http://localhost:3000 (本地开发)
   ```

---

### 2. GitHub 配置

#### 2.1 创建仓库

1. 访问 [github.com/new](https://github.com/new)
2. 填写仓库信息:
   - **Repository name**: anki-tracker
   - **Visibility**: Public 或 Private
3. 点击 **Create repository**

#### 2.2 推送代码

```bash
# 初始化本地仓库
git init
git add .
git commit -m "Initial commit"

# 连接远程仓库
git remote add origin https://github.com/YOUR_USERNAME/anki-tracker.git
git branch -M main
git push -u origin main
```

---

### 3. Vercel 配置

#### 3.1 导入项目

1. 访问 [vercel.com](https://vercel.com) 并用 GitHub 登录
2. 点击 **Add New...** → **Project**
3. 选择 **Import Git Repository**
4. 找到并选择 `anki-tracker` 仓库
5. 点击 **Import**

#### 3.2 配置项目

1. **Framework Preset**: Other
2. **Build and Output Settings**: 保持默认（静态网站无需构建）
3. 点击 **Deploy**

#### 3.3 配置自定义域名（可选）

1. 进入项目 **Settings** → **Domains**
2. 添加自定义域名
3. 按提示在 DNS 中添加记录

#### 3.4 更新 OAuth Redirect URLs

部署完成后，获取 Vercel 分配的域名（如 `anki-tracker-xxx.vercel.app`），然后:

1. 更新 Google Cloud Console 的 Authorized redirect URIs
2. 更新 GitHub OAuth App 的 Authorization callback URL
3. 更新 Supabase 的 Site URL 和 Redirect URLs

---

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/anki-tracker.git
cd anki-tracker

# 直接打开 index.html 或使用本地服务器
# 方法1: Python
python -m http.server 3000

# 方法2: Node.js (需要安装 serve)
npx serve .

# 方法3: VS Code Live Server 插件
```

访问 `http://localhost:3000`

---

## 项目文件结构

```
anki-tracker/
├── index.html          # 主 HTML 结构
├── css/
│   └── styles.css      # 所有样式 (~400行)
├── js/
│   ├── config.js       # Supabase 配置 & 全局状态
│   ├── auth.js         # 认证函数 (signIn, signUp, OAuth, signOut)
│   ├── data.js         # 数据操作 (loadData, saveRecord, deleteRecord)
│   ├── ui.js           # UI 更新函数
│   ├── charts.js       # Chart.js 图表渲染
│   └── app.js          # 入口文件、事件绑定
├── CLAUDE.md           # Claude Code 开发指南
└── README.md           # 本文档
```

---

## 安全说明

- **anon key 是公开的**: Supabase 的 anon key 可以安全地放在前端代码中
- **数据安全由 RLS 保证**: Row Level Security 确保用户只能访问自己的数据
- **OAuth Token 自动管理**: Supabase JS Client 自动处理 token 刷新
- **HTTPS 加密**: 所有通信都通过 HTTPS 加密

---

## 常见问题

### Q: 刷新后数据消失？
A: 检查浏览器控制台是否有错误。确保 `initApp()` 没有被重复调用导致竞态条件。

### Q: OAuth 登录失败？
A: 检查 Supabase 和 OAuth Provider 中的 Redirect URL 是否一致。

### Q: 邮箱注册后没有收到确认邮件？
A: 开发阶段可以在 Supabase 中关闭 "Confirm email"，或配置 SMTP 服务器。

---

## 技术栈

- **前端**: 原生 HTML/CSS/JavaScript
- **图表**: Chart.js
- **后端服务**: Supabase (Auth + PostgreSQL)
- **部署**: Vercel (静态托管)
- **版本控制**: Git + GitHub
