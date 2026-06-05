# 班级综合管理 — 自动同步版

一个纯前端班级管理系统，支持**手机 ↔ 电脑自动同步**。

**架构**：前端（index.html）→ Vercel 云函数 → Supabase 数据库

## 如何部署

### 1. 在 Supabase 创建数据库（已完成 ✅）

- 项目名称：`class-manager`
- 数据库密码：`!SuE1105!1105`
- 连接字符串已就绪

### 2. 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com) → 用 **GitHub** 登录
2. 点 **Add New…** → **Project**
3. 选择 **a911921737-hue/class-manager** 仓库
4. 在配置页面点 **Environment Variables** → 添加：
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:%21SuE1105%211105@db.phkeqohmymnrvzbmjjrh.supabase.co:5432/postgres`
5. **Framework Preset** 保持默认（Other）
6. 点 **Deploy**（部署）
7. 部署完成后会得到一个 URL，如 `https://class-manager.vercel.app`

### 3. 配置前端

1. 打开浏览器访问 `index.html`
2. 左侧菜单点 **⚙️ 同步设置**
3. 填入：
   - **同步服务器地址**: `https://class-manager.vercel.app`（上一步得到的地址）
   - **班级同步密钥**: 随便填一个唯一标识，如 `class2025`
4. 点 **测试连接**，显示「连接成功」就完成了

### 4. 分享给其他人

将 `index.html` 拖到 [app.netlify.com/drop](https://app.netlify.com/drop) 部署，
得到一个公网链接，其他人打开后填入相同的服务器地址和密钥即可共用数据。

### 5. 数据说明

- 所有数据保存在 Supabase 云数据库中
- 修改数据后自动保存到云端
- 每 5 秒轮询检查是否有其他设备修改了数据
- 界面角落显示同步状态（已同步/同步中/未连接）
