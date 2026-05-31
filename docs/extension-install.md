# 扩展安装指南

## 本地预览

运行：

```bash
npm run dev -- --port 5174
```

打开：

```text
http://127.0.0.1:5174/sidepanel.html
```

注意：本地预览只用于检查 UI。完整扫描、下载、侧边栏和文件夹授权需要在真实 Chrome / Edge 扩展环境中测试。

## 构建未打包扩展

```bash
npm run build
npm run verify:dist
```

构建目录：

```text
dist/
```

## Chrome 加载方式

1. 打开 `chrome://extensions`
2. 打开 `Developer mode`
3. 点击 `Load unpacked`
4. 选择本项目里的 `dist/` 文件夹
5. 打开 `https://chatgpt.com/`
6. 打开扩展侧边栏
7. 点击 `Scan`

## Edge 加载方式

1. 打开 `edge://extensions`
2. 打开开发者模式
3. 点击加载解压缩扩展
4. 选择本项目里的 `dist/` 文件夹

## 打包发布 zip

```bash
npm run package:extension
```

输出：

```text
release/chatgpt-to-obsidian-vault-0.1.0.zip
```

## 使用提醒

- `Scan` 扫描当前会话，并读取侧边栏摘要。
- `Scan Recent` 扫描最近 10 / 25 / 50 条会话全文。
- `Scan Selected` 只扫描左侧已勾选的会话。
- `All` 会扫描全部发现的会话，可能很慢。
- `Choose Vault` 用于授权 Obsidian Vault 文件夹。
- 未授权 Vault 时会保存到浏览器 Downloads。

## 故障排查

### Scan 后只有 summary only

这是正常现象。ChatGPT 侧边栏通常只暴露标题和链接，不包含完整消息正文。

解决方式：

1. 勾选这些 summary-only 会话。
2. 点击 `Scan Selected`。
3. 等扩展逐个打开会话并抽取全文。

### 只能保存到 Downloads

点击顶部或底部的 `Choose Vault`，选择 Obsidian Vault 或子目录。授权成功后会直接写入 Vault。

### Scan All 很慢

全量扫描必须逐个加载真实会话页面。优先使用：

- `Scan Recent 10`
- `Scan Selected`

### Service Worker 显示 inactive

Manifest V3 的 service worker 会在空闲时暂停，这是正常行为。点击扫描、下载或其他后台动作时会被唤醒。
