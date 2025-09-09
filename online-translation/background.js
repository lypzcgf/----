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

async syncToFeishu(request) {
    try {
        // 首先检查飞书配置是否完整
        const feishuConfig = await chrome.storage.local.get([
            'feishuAppId', 
            'feishuAppSecret', 
            'feishuBitableToken', 
            'feishuTableId'
        ]);
        
        // 检查所有必需的配置项是否存在且不为空
        if (!feishuConfig.feishuAppId || !feishuConfig.feishuAppSecret || 
            !feishuConfig.feishuBitableToken || !feishuConfig.feishuTableId) {
            throw new Error('飞书配置不完整，请先设置飞书应用ID、应用密钥、多维表格Token和数据表ID');
        }
        
        // 获取当前时间戳
        const now = new Date();
        const syncTime = now.toISOString();
        const lastModifiedTime = now.toISOString();
        
        // 构建飞书多维表格记录
        const record = {
            fields: {
                "原文": request.originalText,
                "翻译结果": request.translationResult,
                "源语言": request.sourceLang,
                "目标语言": request.targetLang,
                "操作类型": "翻译",
                "同步时间": syncTime,
                "最后修改时间": lastModifiedTime,
                "URL": request.url,
                "标题": request.title,
                "大模型": request.model,
                "创建时间": syncTime
            }
        };
        
        // 发送请求到飞书多维表格API
        const response = await fetch(`https://open.feishu.cn/open-api/bitable/v1/apps/${feishuConfig.feishuAppId}/tables/${feishuConfig.feishuTableId}/records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await this.getFeishuAccessToken(feishuConfig.feishuAppId, feishuConfig.feishuAppSecret)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                records: [record]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`飞书API请求失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('同步到飞书失败:', error);
        throw error;
    }
}
