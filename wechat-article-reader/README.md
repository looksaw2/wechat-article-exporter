# 微信文章本地导出

本项目现在只保留 Chrome 扩展。源码采用 MIT 许可证，免费使用，无需 Python、uv、Node.js 或 npm 构建。

## 安装和使用

1. 在你平常使用的 Chrome 打开 `chrome://extensions`。
2. 开启“开发者模式”，点击“加载未打包的扩展程序”（部分 Chrome 版本称“加载已解压的扩展程序”）。
3. 选择本项目的 `chrome-extension` 文件夹，这一层应直接包含 `manifest.json`。
4. 在工具栏拼图菜单中找到“微信文章本地导出”，固定到工具栏。
5. 打开文章并由你本人手动完成验证；看到正文后，点击扩展图标，选择“预览正文”或“导出 Markdown”。

也可以先克隆仓库，然后在 Chrome 中加载其中的 `chrome-extension/` 文件夹：

```sh
git clone https://github.com/looksaw2/wechat-article-exporter.git
```

扩展文件夹需要保留在加载时的位置。修改源码后，在 `chrome://extensions` 点击本扩展的刷新按钮。

## 功能与权限

提取当前文章页的标题、公众号、作者、发布时间和正文。支持 Markdown 预览与编辑，保留段落、标题、列表、引用、代码、表格和图片链接。

只有 `activeTab`、`scripting` 和 `downloads` 权限。用户主动点击时读取当前页面，生成本地 Markdown 文件。没有 Cookie 读取、自动导航、curl 请求或后端服务。

完整安装、权限和格式说明见 [扩展说明](chrome-extension/README.md)。

## 文件结构

- `chrome-extension/`：可直接在 Chrome 中加载的扩展及 MIT 许可证。
- `tests/extension.html`：用本地 DOM 样例检查正文转换，可在本机 Chrome 中打开。
- `tests/extension-popup.test.mjs`：弹窗和导出流程检查。

## 开发检查

如需运行弹窗流程检查，在项目目录执行：

```sh
node --test tests/extension-popup.test.mjs
```

测试使用 Node 内置工具，不需要 npm 依赖。安装和日常使用扩展不需要 Node。
