# 班级综合管理 — 自动同步版

一个纯前端班级管理系统，支持**手机 ↔ 电脑自动同步**。

## 如何部署同步后端

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "班级管理系统 + 云端同步后端"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

> 如果你还没有 GitHub 账号，先去 [github.com](https://github.com) 注册。  
> 创建一个新仓库（New repository），名称随意（如 `class-manager`）。  
> 创建后把上面命令中的「你的用户名/你的仓库名」换成你实际的。

### 2. 在 Render 部署

1. 打开 [render.com](https://render.com) → 用 GitHub 登录
2. 点 **New +** → **Web Service**
3. 连接你的 GitHub，选择刚创建的仓库
4. 填写：
   - **Name**: `class-manager-sync`
   - **Region**: 选离你近的（新加坡或美国）
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. 点 **Create Web Service**
6. 等 2-3 分钟，部署完成后会显示一个 URL，如 `https://class-manager-sync.onrender.com`

### 3. 配置前端连接到后端

1. 打开浏览器访问 `index.html`
2. 左侧菜单点 **⚙️ 同步设置**
3. 填入：
   - **同步服务器地址**: 上一步得到的 URL（如 `https://class-manager-sync.onrender.com`）
   - **班级同步密钥**: 随便填一个唯一标识，如 `class2025`
4. 点 **测试连接**，显示「连接成功」即完成
5. 手机和电脑填相同的地址和密钥，数据就会自动同步

### 4. 共享给其他人

将 `index.html` 拖到 [app.netlify.com/drop](https://app.netlify.com/drop) 部署，
得到一个公网链接，其他人打开后填入相同的服务器地址和密钥即可共用数据。
