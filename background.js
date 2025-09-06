// Background Script - 插件后台服务
class BackgroundManager {
    constructor() {
        // 移除硬编码的API Key
        // this.KIMI_API_KEY = 'sk-LTIebGczJcAws63kcVpQQjfgu0Ip98RQdC6lcBPRpESoShzF';
        
        this.init();
    }

    init() {
        // 监听消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开放
        });

        // 当插件安装时设置sidePanel
        chrome.runtime.onInstalled.addListener(() => {
            chrome.sidePanel.setPanelBehavior({
                openPanelOnActionClick: true
            }).catch((error) => {
                console.log('Side panel behavior error:', error);
            });
        });

        // 监听来自sidebar的配置请求
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "saveApiKey") {
                this.saveApiKey(request.apiKey);
                sendResponse({ success: true });
            } else if (request.action === "testConnection") {
                this.testConnection(request.apiKey);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    // 保存API Key到存储
    async saveApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ kimiApiKey: apiKey });
            console.log('API Key saved successfully');
        } catch (error) {
            console.error('Failed to save API Key:', error);
        }
    }

    // 测试API连接
    async testConnection(apiKey) {
        try {
            const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello, how are you?'
                        }
                    ]
                })
            });

            if (response.ok) {
                console.log('API connection test successful');
                return { success: true, message: '连接成功' };
            } else {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('API connection test failed:', error);
            return { success: false, message: error.message };
        }
    }

    // 处理消息
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'translate':
                this.handleTranslate(request, sender, sendResponse);
                break;
            default:
                // 对于未处理的消息，不发送响应
                return false;
        }
    }

    // 处理翻译请求
    async handleTranslate(request, sender, sendResponse) {
        try {
            // 从存储中获取API Key
            const storage = await chrome.storage.local.get('kimiApiKey');
            const apiKey = storage.kimiApiKey;
            
            if (!apiKey) {
                throw new Error('API Key未配置，请在侧边栏中设置Kimi API Key');
            }
            
            const result = await this.performTranslation(
                request.text, 
                request.sourceLang, 
                request.targetLang,
                apiKey
            );
            
            // 将翻译结果发送到sidebar显示
            chrome.runtime.sendMessage({
                action: "displayResult",
                result: result
            }).catch(error => {
                console.error('发送翻译结果失败:', error);
            });
            
            sendResponse({ success: true });
        } catch (error) {
            console.error('翻译失败:', error);
            
            chrome.runtime.sendMessage({
                action: "displayResult",
                result: {
                    error: error.message
                }
            }).catch(err => {
                console.error('发送错误结果失败:', err);
            });
            
            sendResponse({ success: false, error: error.message });
        }
    }

    // 执行翻译功能
    async performTranslation(text, sourceLang, targetLang, apiKey) {
        // 记录开始时间
        const startTime = Date.now();
        
        try {
            // 使用 Kimi API 进行翻译
            const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [
                        {
                            role: 'user',
                            content: `请将以下文本从${sourceLang === 'auto' ? '自动检测的语言' : sourceLang}翻译成${targetLang}，只返回翻译结果，不要添加任何解释或其他内容：\n\n${text}`
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            const translatedText = result.choices[0].message.content.trim(); // 去除首尾空白
            
            // 计算翻译时间
            const translationTime = ((Date.now() - startTime) / 1000).toFixed(2);
            
            // 统计文本信息
            const characterCount = text.length;
            const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
            const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length;
            const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
            
            return {
                text: translatedText,
                translationTime: translationTime,
                characterCount: characterCount,
                wordCount: wordCount,
                paragraphCount: paragraphCount,
                lineCount: lineCount
            };
        } catch (error) {
            throw new Error(`翻译失败: ${error.message}`);
        }
    }
}

// 初始化后台管理器
const backgroundManager = new BackgroundManager();