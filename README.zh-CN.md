# 多端剪切板同步应用

这是一个基于Cloudflare Worker的多端剪切板同步应用，允许用户在多个设备之间同步文本内容。全程使用cursor自动编写。

## 功能特点

- 密码保护：用户可以创建或加入一个同步组，通过输入相同的密码
- 实时同步：在一个设备上输入的内容会实时同步到所有使用相同密码的设备
- 历史记录：保留所有同步内容的历史记录
- 响应式设计：适配各种设备屏幕大小
- 安全性：密码必须包含字母、数字，长度至少13位
- 懒加载：历史记录较多时支持分页加载

## 技术栈

- 前端：HTML, CSS, JavaScript (使用Vue.js框架)
- 后端：Cloudflare Worker
- 数据存储：Cloudflare KV存储

## 快速部署

### 前提条件

1. 安装 [Node.js](https://nodejs.org/) (版本 14 或更高)
2. 拥有Cloudflare账户

### 部署步骤

1. 克隆此仓库：
   ```
   git clone https://github.com/xxiaocheng/cf-workers-clipboard.git
   cd cf-workers-clipboard
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 登录到你的Cloudflare账户：
   ```
   npx wrangler login
   ```

4. 创建KV命名空间：
   ```
   npx wrangler kv:namespace create "CLIPBOARD_DATA"
   ```

5. 将生成的KV命名空间ID添加到`wrangler.toml`文件中：
   ```
   # 编辑 wrangler.toml 文件，将 "替换为您的KV命名空间ID" 替换为上一步生成的ID
   ```

6. 部署Worker：
   ```
   npx wrangler publish
   ```

7. 部署完成后，Wrangler会提供一个URL，您可以通过该URL访问应用

## 本地开发

1. 安装依赖：
   ```
   npm install
   ```

2. 启动本地开发服务器：
   ```
   npx wrangler dev
   ```

3. 在浏览器中访问 `http://localhost:8787`

## 使用说明

1. 打开应用URL
2. 输入一个强密码（至少13位，包含字母和数字）
3. 如果密码是新创建的，系统会创建一个新的同步组
4. 如果密码已存在，您将加入该密码对应的同步组
5. 在输入框中输入文本内容并发送
6. 所有使用相同密码的设备都会收到同步的内容

## 常见问题解决

### 1. 命令未找到错误

如果遇到 `command not found: wrangler` 错误，请使用 `npx` 来运行 wrangler 命令：

```
npx wrangler <命令>
```

### 2. 部署后页面显示 "Not Found"

如果部署后访问页面显示 "Not Found"，可能是由于以下原因：

- Worker 代码中的路由配置有问题
- 静态资源未正确初始化

解决方法：
- 确保 `index.js` 文件中的路由处理正确
- 检查 `wrangler.toml` 文件中的配置是否正确
- 尝试重新部署 Worker

### 3. KV 存储问题

如果遇到 KV 存储相关的问题，可以通过访问 `/debug` 路径来查看当前 KV 存储中的键值：

```
https://your-worker-url.workers.dev/debug
```

## 未来计划

- 支持图片、视频和文件同步
- 添加端到端加密
- 支持内容过期时间设置
- 添加更多自定义设置选项

## 许可证

MIT 