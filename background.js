// Background Script - 插件后台服务
class BackgroundManager {
    constructor() {
        // 定义支持的大模型配置
        this.models = {
            kimi: {
                name: 'Kimi',
                defaultBaseUrl: 'https://api.moonshot.cn/v1',
                defaultModelEndpoint: 'moonshot-v1-8k'
            },
            deepseek: {
                name: 'DeepSeek',
                defaultBaseUrl: 'https://api.deepseek.com/v1',
                defaultModelEndpoint: 'deepseek-chat'
            },
            qwen: {
                name: 'Qwen',
                defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // 修改为新的API地址
                defaultModelEndpoint: 'qwen-turbo'
            },
            doubao: {
                name: 'Doubao',
                defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                defaultModelEndpoint: ''
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
    }

    // 统一的消息处理方法
    async handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'translate':
                this.handleTranslate(request, sender, sendResponse);
                return true;
            case 'rewrite':
                this.handleRewrite(request, sender, sendResponse);
                return true;
            case 'saveApiKey':
                this.saveApiKey(request.model, request.apiKey, request.modelEndpoint, request.baseUrl)
                    .then(() => sendResponse({ success: true }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            case 'testConnection':
                this.testConnection(request.model, request.apiKey, request.modelEndpoint, request.baseUrl)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ success: false, message: error.message }));
                return true;
            case 'testFeishuConnection':
                try {
                    const result = await this.testFeishuConnection(request.config);
                    sendResponse({ success: true, data: result });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            case 'loadModelConfig':
                this.loadModelConfig(request.model)
                    .then(config => sendResponse({ success: true, config }))
                    .catch(error => sendResponse({ success: false, message: error.message }));
                return true;
            case 'syncToFeishu':
                this.syncToFeishu(request)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            case 'getBookmarks':
                this.getBookmarksData()
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            case 'syncBookmarks':
                this.syncBookmarksToFeishu(request)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            case 'exportBookmarks':
                this.exportBookmarksData(request.format)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            default:
                return false; // 不处理未知消息
        }
    }

    // 保存API Key到存储
    async saveApiKey(model, apiKey, modelEndpoint = null, baseUrl = null) {
        try {
            const key = `${model}ApiKey`;
            const data = { [key]: apiKey };
            
            // 保存模型端点
            if (modelEndpoint) {
                data[`${model}ModelEndpoint`] = modelEndpoint;
            }
            
            // 保存Base URL
            if (baseUrl) {
                data[`${model}BaseUrl`] = baseUrl;
            }
            
            await chrome.storage.local.set(data);
            console.log(`${model} API Key saved successfully`);
        } catch (error) {
            console.error(`Failed to save ${model} API Key:`, error);
            throw error;
        }
    }
    
    // 加载模型配置
    async loadModelConfig(model) {
        try {
            const key = `${model}ApiKey`;
            const endpointKey = `${model}ModelEndpoint`;
            const baseUrlKey = `${model}BaseUrl`;
            const storage = await chrome.storage.local.get([key, endpointKey, baseUrlKey]);
            
            // 获取默认配置
            const defaultConfig = this.models[model] || {};
            
            return {
                apiKey: storage[key] || null,
                modelEndpoint: storage[endpointKey] || defaultConfig.defaultModelEndpoint || null,
                baseUrl: storage[baseUrlKey] || defaultConfig.defaultBaseUrl || null
            };
        } catch (error) {
            console.error(`Failed to load ${model} config:`, error);
            throw error;
        }
    }

    // 测试API连接
    async testConnection(model, apiKey, modelEndpoint = null, baseUrl = null) {
        try {
            const modelConfig = this.models[model];
            if (!modelConfig) {
                throw new Error(`不支持的大模型: ${model}`);
            }
            
            // 获取默认配置
            const defaultConfig = this.models[model] || {};
            const actualBaseUrl = baseUrl || defaultConfig.defaultBaseUrl;
            const actualModelEndpoint = modelEndpoint || defaultConfig.defaultModelEndpoint;
            
            if (!actualBaseUrl || !actualModelEndpoint) {
                throw new Error(`缺少必要的配置信息: Base URL或模型端点`);
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
            
            // 构建请求URL
            let requestUrl = '';
            if (model === 'doubao') {
                // Doubao使用查询参数形式
                requestUrl = `${actualBaseUrl}/chat/completions?model_endpoint=${actualModelEndpoint}`;
            } else {
                // 其他模型使用路径形式
                requestUrl = `${actualBaseUrl}/chat/completions`;
            }
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: actualModelEndpoint,
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
                const errorText = await response.text();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }
        } catch (error) {
            console.error(`${model} API connection test failed:`, error);
            return { success: false, message: error.message };
        }
    }

    // 处理翻译请求
    async handleTranslate(request, sender, sendResponse) {
        try {
            // 从存储中获取当前选择的模型和API Key
            const selectedModel = request.model || 'kimi';
            const storageKey = `${selectedModel}ApiKey`;
            const endpointKey = `${selectedModel}ModelEndpoint`;
            const baseUrlKey = `${selectedModel}BaseUrl`;
            const storage = await chrome.storage.local.get([storageKey, endpointKey, baseUrlKey]);
            const apiKey = storage[storageKey];
            const modelEndpoint = storage[endpointKey];
            const baseUrl = storage[baseUrlKey];
            
            // 获取默认配置
            const defaultConfig = this.models[selectedModel] || {};
            const actualModelEndpoint = modelEndpoint || defaultConfig.defaultModelEndpoint;
            const actualBaseUrl = baseUrl || defaultConfig.defaultBaseUrl;
            
            if (!apiKey) {
                throw new Error(`API Key未配置，请在侧边栏中设置${this.models[selectedModel]?.name || selectedModel} API Key`);
            }
            
            if (!actualBaseUrl || !actualModelEndpoint) {
                throw new Error(`缺少必要的配置信息: Base URL或模型端点`);
            }
            
            const result = await this.performTranslationWithRetry(
                request.text, 
                request.sourceLang, 
                request.targetLang,
                apiKey,
                selectedModel,
                actualModelEndpoint,
                actualBaseUrl
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

    // 处理改写请求
    async handleRewrite(request, sender, sendResponse) {
        try {
            const { text, prompt, model } = request;
            
            // 构建改写提示词
            const fullPrompt = `${prompt}\n\n需要改写的文本：${text}`;
            
            // 记录开始时间
            const startTime = Date.now();
            
            // 加载模型配置
            const config = await this.loadModelConfig(model);
            
            // 调用大模型API
            const result = await this.callModelAPI(model, config, fullPrompt);
            
            // 计算耗时
            const rewriteTime = ((Date.now() - startTime) / 1000).toFixed(2);
            
            // 返回结果
            sendResponse({
                success: true,
                result: {
                    text: result.text,
                    rewriteTime: rewriteTime,
                    originalCharCount: text.length,
                    rewriteCharCount: result.text.length
                }
            });
        } catch (error) {
            console.error('改写请求失败:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    // 调用大模型API的通用方法
    async callModelAPI(model, config, prompt) {
        // 根据不同模型调用对应的API
        switch (model) {
            case 'kimi':
                return await this.callKimiAPI(config, prompt);
            case 'deepseek':
                return await this.callDeepSeekAPI(config, prompt);
            case 'qwen':
                return await this.callQwenAPI(config, prompt);
            case 'doubao':
                return await this.callDoubaoAPI(config, prompt);
            default:
                throw new Error(`不支持的模型: ${model}`);
        }
    }

    // 调用Kimi API
    async callKimiAPI(config, prompt) {
        const apiUrl = `${config.baseUrl}/chat/completions`;
        const apiKey = config.apiKey;
        const modelEndpoint = config.modelEndpoint;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelEndpoint,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Kimi API请求失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // 检查响应格式
        if (result.choices && result.choices[0] && result.choices[0].message) {
            return {
                text: result.choices[0].message.content.trim()
            };
        } else {
            throw new Error('Kimi API返回格式不正确');
        }
    }

    // 调用DeepSeek API
    async callDeepSeekAPI(config, prompt) {
        const apiUrl = `${config.baseUrl}/chat/completions`;
        const apiKey = config.apiKey;
        const modelEndpoint = config.modelEndpoint;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelEndpoint,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API请求失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // 检查响应格式
        if (result.choices && result.choices[0] && result.choices[0].message) {
            return {
                text: result.choices[0].message.content.trim()
            };
        } else {
            throw new Error('DeepSeek API返回格式不正确');
        }
    }

    // 调用Qwen API
    async callQwenAPI(config, prompt) {
        const apiUrl = `${config.baseUrl}/chat/completions`;
        const apiKey = config.apiKey;
        const modelEndpoint = config.modelEndpoint;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelEndpoint,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen API请求失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // 首先检查标准的OpenAI格式响应
        if (result.choices && result.choices[0] && result.choices[0].message) {
            return {
                text: result.choices[0].message.content.trim()
            };
        }
        
        // 如果标准格式不匹配，再检查Qwen特有的格式
        if (result.output && result.output.text) {
            return {
                text: result.output.text.trim()
            };
        }
        
        throw new Error('Qwen API返回格式不正确');
    }

    // 调用Doubao API
    async callDoubaoAPI(config, prompt) {
        const apiUrl = `${config.baseUrl}/chat/completions`;
        const apiKey = config.apiKey;
        const modelEndpoint = config.modelEndpoint;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelEndpoint,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Doubao API请求失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // 检查响应格式
        if (result.choices && result.choices[0] && result.choices[0].message) {
            return {
                text: result.choices[0].message.content.trim()
            };
        } else {
            throw new Error('Doubao API返回格式不正确');
        }
    }

    // 带重试机制的翻译功能
    async performTranslationWithRetry(text, sourceLang, targetLang, apiKey, model, modelEndpoint, baseUrl, retryCount = 0) {
        const maxRetries = 3;
        const baseDelay = 1000; // 基础延迟1秒
        
        try {
            return await this.performTranslation(text, sourceLang, targetLang, apiKey, model, modelEndpoint, baseUrl);
        } catch (error) {
            // 如果是429错误且还有重试次数，则进行重试
            if (error.message.includes('429') && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount); // 指数退避
                console.log(`遇到429错误，${delay}ms后进行第${retryCount + 1}次重试`);
                
                // 等待指定时间后重试
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.performTranslationWithRetry(text, sourceLang, targetLang, apiKey, model, modelEndpoint, baseUrl, retryCount + 1);
            }
            
            // 其他错误或重试次数已用完，直接抛出错误
            throw error;
        }
    }

    // 执行翻译功能
    async performTranslation(text, sourceLang, targetLang, apiKey, model, modelEndpoint, baseUrl) {
        // 记录开始时间
        const startTime = Date.now();
        
        try {
            // 准备请求头
            let headers = {
                'Content-Type': 'application/json'
            };
            
            // 根据不同模型设置认证头
            if (model === 'qwen') {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['X-DashScope-SSE'] = 'disable'; // 禁用SSE
            } else {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            
            // 构建请求URL
            let requestUrl = '';
            if (model === 'doubao') {
                // Doubao使用查询参数形式
                requestUrl = `${baseUrl}/chat/completions?model_endpoint=${modelEndpoint}`;
            } else {
                // 其他模型使用路径形式
                requestUrl = `${baseUrl}/chat/completions`;
            }
            
            // 构造请求体
            let requestBody = {
                model: modelEndpoint,
                messages: [
                    {
                        role: 'user',
                        content: `请将以下文本从${sourceLang === 'auto' ? '自动检测的语言' : sourceLang}翻译成${targetLang}，只返回翻译结果，不要添加任何解释或其他内容：\n\n${text}`
                    }
                ]
            };
            
            // 添加语言检测参数
            let detectedLanguage = sourceLang; // 默认使用选择的语言
            
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
                    result_format: 'message'
                };
                
                // 如果是自动检测，添加语言检测参数
                if (sourceLang === 'auto') {
                    requestBody.parameters = {
                        result_format: 'message',
                        language_detection: true
                    };
                }
                // 保留顶层messages字段，确保API能正确识别参数
            }
            
            // 使用对应的大模型API进行翻译
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
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
                // 根据阿里云Qwen API文档，兼容模式下的响应格式与OpenAI类似
                console.log('Qwen API response:', result);
                if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
                    translatedText = result.choices[0].message.content.trim();
                    
                    // 尝试获取检测到的语言（如果有的话）
                    if (sourceLang === 'auto' && result.choices[0].message.role === 'assistant' && result.choices[0].message.content) {
                        // Qwen API在某些情况下会在响应中包含检测到的语言信息
                        // 这里我们暂时使用默认值，实际应用中可能需要更复杂的处理
                        detectedLanguage = '自动检测';
                    }
                } else if (result.output && result.output.text) {
                    translatedText = result.output.text.trim();
                    detectedLanguage = '自动检测';
                } else {
                    throw new Error('Qwen API返回格式不正确');
                }
            } else if (model === 'doubao') {
                // Doubao的响应格式与Kimi和DeepSeek类似
                translatedText = result.choices[0].message.content.trim();
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
                lineCount: lineCount,
                detectedLanguage: detectedLanguage // 添加检测到的语言信息
            };
        } catch (error) {
            throw new Error(`翻译失败: ${error.message}`);
        }
    }
    
    // 测试飞书连接
    async testFeishuConnection(config) {
        try {
            // 验证配置
            if (!config.appId || !config.appSecret || !config.bitableToken) {
                throw new Error('飞书配置不完整，请检查应用ID、应用密钥和多维表格Token');
            }
            
            // 获取tenant_access_token
            const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
                body: JSON.stringify({
                    app_id: config.appId,
                    app_secret: config.appSecret
                })
            });
            
            const tokenData = await tokenResponse.json();
            
            if (tokenData.code !== 0) {
                throw new Error(`获取访问令牌失败: ${tokenData.msg}`);
            }
            
            // 使用令牌测试多维表格访问
            const testResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.bitableToken}/tables`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenData.tenant_access_token}`,
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                }
            });
            
            const testData = await testResponse.json();
            
            if (testData.code !== 0) {
                throw new Error(`访问多维表格失败: ${testData.msg}`);
            }
            
            return {
                message: '连接测试成功',
                tables: testData.data.items
            };
        } catch (error) {
            console.error('飞书连接测试失败:', error);
            throw error;
        }
    }
    
    // 同步数据到飞书多维表格
    async syncToFeishu(request) {
        try {
            // 获取飞书配置
            const result = await chrome.storage.local.get(['feishuConfig']);
            const config = result.feishuConfig;
            
            if (!config || !config.appId || !config.appSecret || !config.bitableToken) {
                throw new Error('飞书配置不完整，请先在配置页面配置飞书参数');
            }
            
            // 检查是否配置了表格ID
            if (request.type === 'translation' && !config.tableId) {
                throw new Error('未配置翻译数据表ID，请在飞书配置中指定翻译数据表ID');
            }
            
            if (request.type === 'rewrite' && !config.rewriteTableId) {
                throw new Error('未配置改写数据表ID，请在飞书配置中指定改写数据表ID');
            }
            
            // 获取访问令牌
            const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: config.appId,
                    app_secret: config.appSecret
                })
            });
            
            const tokenData = await tokenResponse.json();
            
            if (tokenData.code !== 0) {
                throw new Error(`获取访问令牌失败: ${tokenData.msg}`);
            }
            
            const accessToken = tokenData.tenant_access_token;
            
            // 格式化时间显示
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };
            
            // 构造飞书记录数据
            const recordData = {
                fields: {
                    '原文内容': request.originalText,
                    '操作类型': request.type === 'translation' ? '翻译' : '改写',
                    '操作时间': formatDate(request.timestamp),
                    '使用模型': request.model,
                    '页面URL': request.url,
                    '页面标题': request.title,
                    '同步时间': formatDate(new Date().toISOString()),
                    '最后修改时间': formatDate(new Date().toISOString())
                }
            };
            
            // 根据操作类型添加特有字段
            if (request.type === 'translation') {
                recordData.fields['翻译结果'] = request.resultText;
                recordData.fields['源语言'] = request.sourceLang;
                recordData.fields['目标语言'] = request.targetLang;
            } else if (request.type === 'rewrite') {
                recordData.fields['改写结果'] = request.resultText;
                recordData.fields['改写提示词'] = request.prompt;
            }
            
            // 根据操作类型选择对应的数据表ID
            const tableId = request.type === 'translation' ? config.tableId : config.rewriteTableId;
            
            // 发送到飞书多维表格
            const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.bitableToken}/tables/${tableId}/records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recordData)
            });
            
            const responseData = await response.json();
            
            if (response.ok && responseData.code === 0) {
                console.log('数据同步成功:', responseData);
                return { success: true, data: responseData.data };
            } else {
                throw new Error(`同步失败: ${responseData.msg || '未知错误'}`);
            }
        } catch (error) {
            console.error('同步到飞书失败:', error);
            throw error;
        }
    }
    
    // 获取Chrome书签数据
    async getBookmarksData() {
        try {
            return new Promise((resolve, reject) => {
                chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    const bookmarks = [];
                    
                    // 递归遍历书签树
                    const traverseBookmarks = (nodes, folderPath = '') => {
                        nodes.forEach(node => {
                            if (node.url) {
                                // 这是一个书签
                                bookmarks.push({
                                    id: node.id,
                                    title: node.title || '无标题',
                                    url: node.url,
                                    folder: folderPath,
                                    createdTime: new Date(node.dateAdded).toISOString(),
                                    lastModified: new Date(node.dateGroupModified || node.dateAdded).toISOString()
                                });
                            } else if (node.children) {
                                // 这是一个文件夹，继续递归
                                const currentPath = folderPath ? `${folderPath}/${node.title}` : node.title;
                                traverseBookmarks(node.children, currentPath);
                            }
                        });
                    };
                    
                    traverseBookmarks(bookmarkTreeNodes);
                    
                    resolve({
                        bookmarks: bookmarks,
                        totalCount: bookmarks.length,
                        timestamp: new Date().toISOString()
                    });
                });
            });
        } catch (error) {
            console.error('获取书签数据失败:', error);
            throw error;
        }
    }
    
    // 同步书签到飞书多维表格
    async syncBookmarksToFeishu(request) {
        try {
            const { mode = 'full' } = request; // 'full' 或 'incremental'
            
            // 获取飞书配置
            const result = await chrome.storage.local.get(['feishuConfig']);
            const config = result.feishuConfig;
            
            if (!config || !config.appId || !config.appSecret || !config.bitableToken) {
                throw new Error('飞书配置不完整，请先在配置页面配置飞书参数');
            }
            
            if (!config.bookmarkTableId) {
                throw new Error('未配置书签数据表ID，请在飞书配置中指定书签数据表ID');
            }
            
            // 获取书签数据
            const bookmarksData = await this.getBookmarksData();
            let bookmarksToSync = bookmarksData.bookmarks;
            
            // 如果是增量同步，过滤出需要同步的书签
            if (mode === 'incremental') {
                const lastSyncResult = await chrome.storage.local.get(['lastBookmarkSync']);
                const lastSyncTime = lastSyncResult.lastBookmarkSync;
                
                if (lastSyncTime) {
                    bookmarksToSync = bookmarksToSync.filter(bookmark => {
                        const bookmarkTime = new Date(bookmark.lastModified).getTime();
                        const lastSync = new Date(lastSyncTime).getTime();
                        return bookmarkTime > lastSync;
                    });
                }
            }
            
            if (bookmarksToSync.length === 0) {
                return {
                    message: '没有需要同步的书签',
                    syncedCount: 0,
                    totalCount: bookmarksData.totalCount
                };
            }
            
            // 获取访问令牌
            const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: config.appId,
                    app_secret: config.appSecret
                })
            });
            
            const tokenData = await tokenResponse.json();
            
            if (tokenData.code !== 0) {
                throw new Error(`获取访问令牌失败: ${tokenData.msg}`);
            }
            
            const accessToken = tokenData.tenant_access_token;
            
            // 格式化时间显示
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };
            
            // 批量同步书签（每次最多20个）
            const batchSize = 20;
            let syncedCount = 0;
            const currentTime = new Date().toISOString();
            
            for (let i = 0; i < bookmarksToSync.length; i += batchSize) {
                const batch = bookmarksToSync.slice(i, i + batchSize);
                const records = batch.map(bookmark => ({
                    fields: {
                        '书签标题': bookmark.title,
                        '书签URL': bookmark.url,
                        '所在文件夹': bookmark.folder || '根目录',
                        '创建时间': formatDate(bookmark.createdTime),
                        '最后修改时间': formatDate(bookmark.lastModified),
                        '同步时间': formatDate(currentTime),
                        '书签ID': bookmark.id
                    }
                }));
                
                // 发送到飞书多维表格
                const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.bitableToken}/tables/${config.bookmarkTableId}/records/batch_create`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        records: records
                    })
                });
                
                const responseData = await response.json();
                
                if (response.ok && responseData.code === 0) {
                    syncedCount += batch.length;
                } else {
                    throw new Error(`同步失败: ${responseData.msg || '未知错误'}`);
                }
                
                // 避免API调用过于频繁
                if (i + batchSize < bookmarksToSync.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // 更新最后同步时间
            await chrome.storage.local.set({ lastBookmarkSync: currentTime });
            
            return {
                message: `成功同步 ${syncedCount} 个书签`,
                syncedCount: syncedCount,
                totalCount: bookmarksData.totalCount,
                mode: mode,
                syncTime: formatDate(currentTime)
            };
        } catch (error) {
            console.error('同步书签到飞书失败:', error);
            throw error;
        }
    }
    
    // 导出书签数据
    async exportBookmarksData(format = 'json') {
        try {
            const bookmarksData = await this.getBookmarksData();
            const bookmarks = bookmarksData.bookmarks;
            
            let exportData;
            let filename;
            let mimeType;
            
            if (format === 'csv') {
                // 导出为CSV格式
                const headers = ['书签标题', '书签URL', '所在文件夹', '创建时间', '最后修改时间'];
                const csvRows = [headers.join(',')];
                
                bookmarks.forEach(bookmark => {
                    const row = [
                        `"${bookmark.title.replace(/"/g, '""')}"`,
                        `"${bookmark.url}"`,
                        `"${bookmark.folder || '根目录'}"`,
                        `"${bookmark.createdTime}"`,
                        `"${bookmark.lastModified}"`
                    ];
                    csvRows.push(row.join(','));
                });
                
                exportData = csvRows.join('\n');
                filename = `bookmarks_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            } else {
                // 导出为JSON格式
                exportData = JSON.stringify({
                    exportTime: new Date().toISOString(),
                    totalCount: bookmarks.length,
                    bookmarks: bookmarks
                }, null, 2);
                filename = `bookmarks_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
            }
            
            // 创建下载链接
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            return {
                downloadUrl: url,
                filename: filename,
                totalCount: bookmarks.length,
                format: format
            };
        } catch (error) {
            console.error('导出书签数据失败:', error);
            throw error;
        }
    }
}

// 初始化后台管理器
const backgroundManager = new BackgroundManager();