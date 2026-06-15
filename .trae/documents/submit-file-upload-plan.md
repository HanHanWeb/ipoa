# 作品提交：链接改为直接文件上传

## 现状分析

### 当前 COS 图片上传流程（经过服务器）

```
浏览器 → POST 文件到 /api/upload（Cloudflare Worker） → Worker 收到文件 → Worker PUT 到腾讯云 COS
```

**问题**：文件经过 Cloudflare Worker 中转，受 Worker CPU/内存/请求体大小限制（免费版 100MB），大文件会超时或失败。

### 新方案：S3 预签名 URL 直传

```
浏览器 → GET /api/upload/work 获取预签名 URL → 浏览器直接 PUT 到 S3（不经过服务器）
```

**优势**：文件直连 S3，服务器只负责生成签名，无文件大小瓶颈。

## 用户决定

- ✅ 使用 **S3 兼容存储**（非 COS）
- ✅ 文件大小上限：**200MB**
- ✅ **两者都保留**：文件上传 + 外部链接输入
- ✅ 上传目录：**`/ipoa_upload`**
- ✅ **重新上传时删除原文件**

## 实施计划

### 1. 安装依赖

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. 新建 S3 工具模块 (`lib/s3.ts`)

- 使用 `@aws-sdk/client-s3` 创建 S3 客户端
- 环境变量配置：`S3_ENDPOINT`、`S3_ACCESS_KEY`、`S3_SECRET_KEY`、`S3_BUCKET`、`S3_REGION`（默认 auto）
- 导出函数：
  - `getSignedUploadUrl(key, contentType)` → 返回预签名 PUT URL
  - `deleteFile(key)` → 删除指定文件
  - `getKeyFromUrl(url)` → 从完整 URL 反推 S3 key

### 3. 新建预签名上传 API (`api/upload/work/route.ts`)

**GET 方法** — 获取预签名上传 URL：
- 验证用户登录状态（cookie `session_user_id`）
- 接收参数：`filename`、`contentType`
- 生成 S3 key：`ipoa_upload/{userId}/{timestamp}_{sanitized_filename}`
- 调用 `getSignedUploadUrl()` 生成预签名 URL
- 返回：`{ uploadUrl, fileUrl, key }`
  - `uploadUrl`：预签名 PUT URL（浏览器直接用这个上传）
  - `fileUrl`：文件最终访问 URL（存入数据库的值）
  - `key`：S3 对象 key（用于后续删除）

**DELETE 方法** — 删除已上传文件：
- 验证用户登录状态
- 接收参数：`key`
- 验证 key 必须以 `ipoa_upload/{userId}/` 开头（只能删自己的文件）
- 调用 `deleteFile()` 删除

### 4. 修改前端提交页面 (`dashboard/submit/page.tsx`)

**UI 改动**：
- `download_url` 区域改为切换式：「上传文件」/「填写链接」两个 Tab
- 上传文件 Tab：
  - 文件选择器，支持 `.pptx`, `.ppt`, `.zip`, `.rar`, `.pdf`, `.docx`, `.7z`
  - 前端校验大小 ≤ 200MB
  - 上传流程：获取预签名 URL → 直接 PUT 到 S3 → 显示进度条
  - 上传成功后显示文件名 + 文件大小
  - 支持「重新上传」按钮（先删除旧文件再上传新文件）
- 填写链接 Tab：保留现有文本输入框

**状态管理**：
- `uploadMode: "file" | "link"` — 当前选择的模式
- `uploadedFile: { key, name, size, url } | null` — 已上传文件信息
- `uploadProgress: number` — 上传进度百分比
- `uploading: boolean` — 上传中状态

**重新上传逻辑**：
1. 如果已有 `uploadedFile`，先调用 `DELETE /api/upload/work` 删除旧文件
2. 清空 `uploadedFile` 状态
3. 选择新文件并重新上传

**提交逻辑**：
- `uploadMode === "file"` 时，`download_url` 字段存入 S3 文件 URL
- `uploadMode === "link"` 时，`download_url` 字段存入用户输入的外部链接
- 在 `download_url` 前加前缀区分类型：`file:{url}` 或 `link:{url}`（或直接存 URL，通过是否包含 `ipoa_upload` 判断）

### 5. 修改提交 API (`api/submissions/route.ts`)

- `download_url` 校验调整：不再强制要求是有效 URL 格式，接受 S3 URL 和外部链接
- 编辑提交时：如果 `download_url` 变化且旧值是 S3 文件，删除旧文件

### 6. 修改作品展示页 (`dashboard/works/[id]/page.tsx`)

- 识别 `download_url` 类型：
  - 包含 `ipoa_upload` → 显示为「下载文件」按钮
  - 其他 → 显示为外部链接

## 需要新增的环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `S3_ENDPOINT` | S3 兼容服务 endpoint | `https://s3.amazonaws.com` 或 `https://xxx.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` | Access Key ID | |
| `S3_SECRET_KEY` | Secret Access Key | |
| `S3_BUCKET` | 存储桶名称 | `my-bucket` |
| `S3_REGION` | 区域 | `auto`（R2）或 `us-east-1`（AWS） |

文件公开访问 URL 格式：`{S3_ENDPOINT}/{S3_BUCKET}/{key}` 或配置 CDN 自定义域名。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `lib/s3.ts` | **新建** - S3 客户端和工具函数 |
| `api/upload/work/route.ts` | **新建** - 预签名上传 + 删除 API |
| `dashboard/submit/page.tsx` | **修改** - 文件上传 UI + 重新上传逻辑 |
| `api/submissions/route.ts` | **小改** - 校验逻辑调整 |
| `dashboard/works/[id]/page.tsx` | **小改** - 文件下载展示 |
| `package.json` | **修改** - 新增 @aws-sdk 依赖 |

## 验证步骤

1. 配置 S3 环境变量后 `npm run dev`
2. 测试上传：选择文件 → 获取预签名 URL → 直传 S3 → 显示成功
3. 测试重新上传：确认旧文件被删除
4. 测试外部链接输入
5. 测试提交后查看和下载
6. 测试编辑提交
7. 部署到 Cloudflare 后验证
