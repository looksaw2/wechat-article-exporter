# 微信文章本地导出

免费开源的 Chrome 扩展：从当前已打开的微信公众号文章提取正文，预览、编辑并保存 Markdown。无需账号、付费服务、Python 或 npm 构建。

## 安装

1. 点击仓库页面的 **Code → Download ZIP**，并解压；也可以运行下面的克隆命令。
2. 在 Chrome 地址栏打开 `chrome://extensions`，开启“开发者模式”。
3. 点击“加载未打包的扩展程序”（也可能显示为“加载已解压的扩展程序”）。
4. 选择仓库内的 **`wechat-article-reader/chrome-extension`** 文件夹；这一层直接包含 `manifest.json`。
5. 在工具栏拼图菜单中找到“微信文章本地导出”，点击图钉固定。

```sh
git clone https://github.com/looksaw2/wechat-article-exporter.git
```

## 使用

在你平常的 Chrome 中打开文章并手动完成验证。看到正文后点击扩展图标，选择“预览正文”或“导出 Markdown”。预览框中的内容可以编辑，随后保存为本地 `.md` 文件。

保留标题、公众号、作者、发布时间和来源，以及段落、标题、列表、引用、代码、表格和图片链接。图片不额外下载；复杂排版无法完全还原，可在预览框调整。

## 权限与隐私

只使用 `activeTab`、`scripting`、`downloads` 三项权限，在你点击按钮时处理当前文章。没有 Cookie 读取、自动导航、curl 请求、后台服务器或内容上传。

## 源码与检查

扩展源码：[wechat-article-reader/chrome-extension](wechat-article-reader/chrome-extension)；[完整说明](wechat-article-reader/chrome-extension/README.md)。

本地正文样例检查：[extension.html](wechat-article-reader/tests/extension.html)。弹窗流程检查使用 Node 内置工具：

```sh
cd wechat-article-reader
node --test tests/extension-popup.test.mjs
```

## 许可证

[MIT License](wechat-article-reader/LICENSE)。
