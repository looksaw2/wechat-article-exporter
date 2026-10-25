# 微信文章本地导出

这是本项目自己的免费 Chrome 扩展，源码采用 MIT 许可证。没有会员、付费接口、后端服务或第三方扩展依赖，安装时不需要 Node.js、npm 或 Python。

## 安装

1. 在你平常使用的 Chrome 地址栏输入 `chrome://extensions`。
2. 开启页面右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本文件所在的文件夹：这一层应直接包含 `manifest.json`、`popup.html` 和 `article.js`。不要选择 ZIP 文件或 `icons` 子目录。
5. 点击 Chrome 工具栏右侧的拼图图标，找到“微信文章本地导出”，将其固定到工具栏。

从源码仓库安装时，选择仓库中的 `chrome-extension/` 文件夹；从 ZIP 安装时，先解压，再选择直接包含 `manifest.json` 的文件夹。

安装后不要删除或移动所加载的文件夹。更新源文件后，在扩展管理页面点击扩展卡片上的刷新按钮。

## 使用

1. 在同一个 Chrome 窗口中，打开你要保存的微信公众号文章。若出现验证，由你本人手动完成。
2. 确认正文已经显示，再点击工具栏的“微信文章本地导出”图标。
3. 点击“预览正文”，可检查并编辑 Markdown；也可以直接点击“导出 Markdown”。
4. 在 Chrome 保存对话框中选择文件位置。文件名取自文章标题。

支持 `https://mp.weixin.qq.com/s/…` 和 `https://mp.weixin.qq.com/s?__biz=…` 文章页。

## 正文与格式

- 提取当前页面中的 `#js_content`。
- 提取可用的标题、公众号名称、作者和发布时间，并保留来源链接。
- 保留段落、标题、加粗、斜体、嵌套列表、引用、代码和表格。
- 图片保留 `data-src` 或 `src` 中的原链接；不会额外下载图片。其他 Markdown 阅读器打开导出文件时可能加载这些远程图片。
- 音频、视频保留可用链接或提示文字，不做 OCR、音频或视频转写。
- 不会把缺少正文容器的验证页面或空正文作为文章导出。
- Markdown 无法完整还原微信的颜色、字号、合并表格单元格和复杂图文卡片。导出后可在预览框中修改。

## 权限与数据

扩展只有三项权限：

- `activeTab`：你点击扩展时，临时允许读取当前标签页。
- `scripting`：在该标签页运行随扩展附带的正文提取脚本。
- `downloads`：把生成的本地 Markdown 文件交给 Chrome 保存。

没有 `cookies`、`debugger`、后台常驻或全站主机权限。不读取浏览器 Cookie、配置数据库或其他标签页；不启动 Chrome、不自动导航、不发送文章网络请求、不上传内容。扩展弹窗关闭后，预览编辑内容即释放，修改后请先保存文件。

本扩展由用户在普通 Chrome 中手动使用，不需要 Codex Computer Use 或 Browser Use。它不修改这些工具的站点策略。

## 源码

- `manifest.json`：Chrome 扩展配置和权限。
- `popup.html` / `popup.css` / `popup.js`：预览、编辑与保存界面。
- `article.js`：从 DOM 提取正文并生成 Markdown。
- `extract-current.js`：将当前标签页的提取结果返回给弹窗。
- `icons/`：本地生成的图标。
- `LICENSE`：MIT 许可证。

## 本地检查

项目 `tests/extension.html` 可在本机 Chrome 中打开，使用本地构造的 DOM 检查正文转换，不请求微信文章。

从项目目录执行 `node --test tests/extension-popup.test.mjs` 可检查预览、编辑、下载和错误处理，使用 Node 内置测试工具，无 npm 依赖。
