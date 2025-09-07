// Background Script - 插件后台服务
class BackgroundManager {
    constructor() {
        // 定义支持的大模型配置
        this.models = {
            kimi: {
                name: 'Kimi',
                apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
                models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
            },
            deepseek: {
                name: 'DeepSeek',
                apiUrl: 'https://api.deepseek.com/v1/chat/completions',
                models: ['deepseek-chat', 'deepseek-coder']
            },
            qwen: {
                name: 'Qwen',
                apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                models: ['qwen-turbo', 'qwen-plus', 'qwen-max']
            }
        };
        
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
                this.saveApiKey(request.model, request.apiKey);
                sendResponse({ success: true });
            } else if (request.action === "testConnection") {
                this.testConnection(request.model, request.apiKey)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ success: false, message: error.message }));
            } else if (request.action === "getModelVersions") {
                const modelConfig = this.models[request.model];
                sendResponse({ 
                    success: true, 
                    versions: modelConfig ? modelConfig.models : [] 
                });
            }
            return true;
        });
    }

    // 保存API Key到存储
    async saveApiKey(model, apiKey) {
        try {
            const key = `${model}ApiKey`;
            await chrome.storage.local.set({ [key]: apiKey });
            console.log(`${model} API Key saved successfully`);
        } catch (error) {
            console.error(`Failed to save ${model} API Key:`, error);
        }
    }

    // 测试API连接
    async testConnection(model, apiKey) {
        try {
            const modelConfig = this.models[model];
            if (!modelConfig) {
                throw new Error(`不支持的大模型: ${model}`);
            }
            
            let headers = {
                'Content-Type': 'application/json'
            };
            
            // 根据不同模型设置认证头
            if (model === 'qwen') {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['X-DashScope-SSE'] = 'enable';
            } else {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            
            const response = await fetch(modelConfig.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: modelConfig.models[0],
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello'
                        }
                    ],
                    max_tokens: 1
                })
            });

            if (response.ok) {
                console.log(`${model} API connection test successful`);
                return { success: true, message: '连接成功' };
            } else {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`${model} API connection test failed:`, error);
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
            // 从存储中获取当前选择的模型和API Key
            const selectedModel = request.model || 'kimi';
            const selectedModelVersion = request.modelVersion || null;
            const storageKey = `${selectedModel}ApiKey`;
            const storage = await chrome.storage.local.get(storageKey);
            const apiKey = storage[storageKey];
            
            if (!apiKey) {
                throw new Error(`API Key未配置，请在侧边栏中设置${this.models[selectedModel]?.name || selectedModel} API Key`);
            }
            
            const result = await this.performTranslationWithRetry(
                request.text, 
                request.sourceLang, 
                request.targetLang,
                apiKey,
                selectedModel,
                selectedModelVersion
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

    // 带重试机制的翻译功能
    async performTranslationWithRetry(text, sourceLang, targetLang, apiKey, model, modelVersion, retryCount = 0) {
        const maxRetries = 3;
        const baseDelay = 1000; // 基础延迟1秒
        
        try {
            return await this.performTranslation(text, sourceLang, targetLang, apiKey, model, modelVersion);
        } catch (error) {
            // 如果是429错误且还有重试次数，则进行重试
            if (error.message.includes('429') && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount); // 指数退避
                console.log(`遇到429错误，${delay}ms后进行第${retryCount + 1}次重试`);
                
                // 等待指定时间后重试
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.performTranslationWithRetry(text, sourceLang, targetLang, apiKey, model, modelVersion, retryCount + 1);
            }
            
            // 其他错误或重试次数已用完，直接抛出错误
            throw error;
        }
    }

    // 执行翻译功能
    async performTranslation(text, sourceLang, targetLang, apiKey, model, modelVersion) {
        // 记录开始时间
        const startTime = Date.now();
        
        try {
            // 获取模型配置
            const modelConfig = this.models[model];
            if (!modelConfig) {
                throw new Error(`不支持的大模型: ${model}`);
            }
            
            // 确定使用的模型版本
            const actualModelVersion = modelVersion || modelConfig.models[0];
            
            // 准备请求头
            let headers = {
                'Content-Type': 'application/json'
            };
            
            // 根据不同模型设置认证头
            if (model === 'qwen') {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['X-DashScope-SSE'] = 'disable';
            } else {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            
            // 构造请求体
            let requestBody = {
                model: actualModelVersion,
                messages: [
                    {
                        role: 'user',
                        content: `请将以下文本从${sourceLang === 'auto' ? '自动检测的语言' : sourceLang}翻译成${targetLang}，只返回翻译结果，不要添加任何解释或其他内容：\n\n${text}`
                    }
                ]
            };
            
            // Qwen模型需要额外的参数
            if (model === 'qwen') {
                requestBody.input = {
                    messages: [
                        {
                            role: 'user',
                            content: `请将以下文本从${sourceLang === 'auto' ? '自动检测的语言' : sourceLang}翻译成${targetLang}，只返回翻译结果，不要添加任何解释或其他内容：\n\n${text}`
                        }
                    ]
                };
                requestBody.parameters = {
                    result_format: 'text'
                };
                // 移除顶层messages字段
                delete requestBody.messages;
            }
            
            // 使用对应的大模型API进行翻译
            const response = await fetch(modelConfig.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            let translatedText = '';
            
            // 根据不同模型的响应格式提取翻译结果
            if (model === 'kimi') {
                translatedText = result.choices[0].message.content.trim();
            } else if (model === 'deepseek') {
                translatedText = result.choices[0].message.content.trim();
            } else if (model === 'qwen') {
                // Qwen的响应格式不同
                if (result.output && result.output.text) {
                    translatedText = result.output.text.trim();
                } else {
                    throw new Error('Qwen API返回格式不正确');
                }
            }
            
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