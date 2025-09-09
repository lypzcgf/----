# 智能翻译助手使用说明

## 简介
这是一个基于 Chrome 扩展的智能文本处理工具，主要提供网页文本翻译和改写功能。插件采用Manifest V3架构，集成了多个主流大语言模型API，为用户提供高质量的文本处理服务。

## 功能特点
- 选中网页文本后自动识别并翻译
- 支持中英文等多种语言互译
- 提供详细的翻译统计信息（字符数、单词数、段落数等）
- 可以复制翻译结果
- 支持多种大语言模型（Kimi、DeepSeek、Qwen、Doubao）
- 支持自定义 API Key 和模型端点
- 提供文本改写功能
- 支持飞书多维表格数据同步
- Chrome书签同步功能

## 使用方法

### 1. 安装插件
1. 下载插件文件夹
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 启用"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择插件文件夹

### 2. 配置 API Key
1. 点击浏览器右上角的插件图标打开侧边栏
2. 在侧边栏中选择对应的大模型标签页
3. 在相应的 "API Key" 输入框中输入您的 API Key
4. 点击"保存"按钮
5. 点击"测试连接"按钮验证 API Key 是否有效

### 3. 使用翻译功能
1. 打开任意网页
2. 选中您想要翻译的文本
3. 点击浏览器右上角的插件图标
4. 点击"获取选中文字"按钮（或自动获取选中文本）
5. 选择源语言和目标语言
6. 点击"开始翻译"按钮
7. 查看翻译结果和统计信息
8. 点击"复制"按钮将翻译结果复制到剪贴板

### 4. 使用文本改写功能
1. 在侧边栏中切换到"文本改写"标签页
2. 输入或获取需要改写的文本
3. 在提示词输入框中描述改写要求
4. 点击"开始改写"按钮
5. 查看改写结果和统计信息
6. 点击"复制"按钮将改写结果复制到剪贴板

### 5. 使用书签同步功能
1. 在侧边栏中切换到"飞书配置"标签页
2. 配置飞书应用信息和书签数据表ID
3. 点击"测试连接"验证配置
4. 切换到"书签同步"标签页
5. 点击"全量同步"或"增量同步"按钮
6. 查看同步状态和结果

### 6. 配置语言
- 源语言：默认为中文(简体)，可在下拉菜单中选择其他语言
- 目标语言：默认为 English，可在下拉菜单中选择其他语言

## 支持的大语言模型
- **Kimi**: https://api.moonshot.cn/
- **DeepSeek**: https://api.deepseek.com/
- **Qwen**: https://dashscope.aliyuncs.com/
- **Doubao**: https://ark.cn-beijing.volces.com/

## 技术细节
- **架构**: 使用 Chrome Extension API 进行 popup、content script 和 background script 之间的通信
- **权限**: 需要 `activeTab`, `scripting`, `storage`, `sidePanel`, `bookmarks` 权限
- **host_permissions**: 访问大模型 API 和飞书 API 的权限

## 常见问题
**Q: 如何获取各模型的 API Key？**
A: 
- Kimi: 访问 https://platform.moonshot.cn/ 注册或登录账户，在控制台中创建 API Key
- DeepSeek: 访问 https://platform.deepseek.com/ 注册或登录账户，在API Keys中创建 API Key
- Qwen: 访问 https://dashscope.console.aliyun.com/ 注册或登录账户，在API Key管理中获取 API Key
- Doubao: 访问 https://console.volcengine.com/ 注册或登录账户，获取相关 API Key

**Q: 翻译结果包含原始文本怎么办？**
A: 插件已经优化了提示词，确保只返回翻译结果。如果仍有问题，请检查您的 API Key 和模型配置。

**Q: 插件无法正常工作怎么办？**
A: 请检查：
1. API Key 是否正确配置
2. 网络连接是否正常
3. 是否有防火墙或代理阻止了 API 请求
4. 尝试重新加载扩展
5. 检查控制台日志以获取更多错误信息

## 贡献
如果您发现任何问题或有改进建议，请提交 issue 或 pull request。

## 版权声明
本插件仅供学习和研究使用，不得用于商业用途。