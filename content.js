// Content Script - 智能翻译助手 v2.0
// 版本标识：2024-01-01-v2.0 - 彻底重写版本，解决sendMessage错误
console.log('Content Script v2.0 开始加载...');

// 全局错误处理
// 增强的全局错误处理
window.addEventListener('error', function(e) {
    const errorInfo = {
        message: e.message || '未知错误',
        filename: e.filename || '未知文件',
        lineno: e.lineno || '未知行号',
        colno: e.colno || '未知列号',
        error: e.error,
        stack: e.error ? e.error.stack : '无堆栈信息',
        timestamp: new Date().toISOString()
    };
    console.error('Content Script 详细错误信息:', errorInfo);
});

// Promise错误处理
window.addEventListener('unhandledrejection', function(e) {
    console.error('Content Script Promise错误:', {
        reason: e.reason,
        promise: e.promise,
        timestamp: new Date().toISOString()
    });
});

// 检查Chrome扩展API可用性
function checkChromeAPI() {
    try {
        if (typeof chrome === 'undefined') {
            console.error('Chrome API 不可用');
            return false;
        }
        if (!chrome.runtime) {
            console.error('chrome.runtime 不可用');
            return false;
        }
        if (!chrome.runtime.id) {
            console.error('chrome.runtime.id 不可用，扩展上下文可能已失效');
            return false;
        }
        console.log('Chrome API 检查通过，扩展ID:', chrome.runtime.id);
        return true;
    } catch (error) {
        console.error('检查Chrome API时出错:', error);
        return false;
    }
}

// 安全的消息发送函数
function safeSendResponse(sendResponse, data) {
    try {
        if (typeof sendResponse === 'function') {
            sendResponse(data);
            console.log('响应发送成功:', data);
        } else {
            console.error('sendResponse 不是函数');
        }
    } catch (error) {
        console.error('发送响应时出错:', error);
    }
}

// 简化的内容管理器
class SimpleContentManager {
    constructor() {
        console.log('SimpleContentManager 构造函数开始');
        this.isInitialized = false;
        this.init();
    }

    init() {
        try {
            console.log('开始初始化 SimpleContentManager');
            
            // 检查Chrome API
            if (!checkChromeAPI()) {
                console.error('Chrome API 不可用，停止初始化');
                return;
            }

            // 设置消息监听器
            this.setupMessageListener();
            
            this.isInitialized = true;
            console.log('SimpleContentManager 初始化完成');
        } catch (error) {
            console.error('初始化 SimpleContentManager 时出错:', error);
        }
    }

    setupMessageListener() {
        try {
            console.log('设置消息监听器');
            
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('收到消息:', request);
                
                try {
                    // 再次检查Chrome API
                    if (!checkChromeAPI()) {
                        safeSendResponse(sendResponse, { 
                            success: false, 
                            error: 'Chrome API 不可用' 
                        });
                        return false;
                    }

                    this.handleMessage(request, sender, sendResponse);
                    return true; // 保持消息通道开放
                } catch (error) {
                    console.error('处理消息时出错:', error);
                    safeSendResponse(sendResponse, { 
                        success: false, 
                        error: '处理消息时出错: ' + error.message 
                    });
                    return false;
                }
            });
            
            console.log('消息监听器设置完成');
        } catch (error) {
            console.error('设置消息监听器时出错:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        try {
            console.log('处理消息:', request.action);
            
            if (!request || !request.action) {
                safeSendResponse(sendResponse, { 
                    success: false, 
                    error: '无效的请求' 
                });
                return;
            }

            switch (request.action) {
                case 'ping':
                    this.handlePing(sendResponse);
                    break;
                case 'getSelectedText':
                    this.handleGetSelectedText(sendResponse);
                    break;
                case 'getTextForTranslation':
                    this.handleGetTextForTranslation(sendResponse);
                    break;

                default:
                    console.log('未知的操作类型:', request.action);
                    safeSendResponse(sendResponse, { 
                        success: false, 
                        error: '未知的操作类型: ' + request.action 
                    });
            }
        } catch (error) {
            console.error('handleMessage 出错:', error);
            safeSendResponse(sendResponse, { 
                success: false, 
                error: 'handleMessage 出错: ' + error.message 
            });
        }
    }

    handlePing(sendResponse) {
        try {
            console.log('处理 ping 请求');
            safeSendResponse(sendResponse, { 
                success: true, 
                message: 'Content script v2.0 is ready',
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('handlePing 出错:', error);
            safeSendResponse(sendResponse, { 
                success: false, 
                error: 'handlePing 出错: ' + error.message 
            });
        }
    }

    handleGetSelectedText(sendResponse) {
        try {
            console.log('处理 getSelectedText 请求');
            
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';
            
            console.log('获取到的选中文本长度:', selectedText.length);
            
            safeSendResponse(sendResponse, {
                success: true,
                text: selectedText,
                hasSelection: selectedText.length > 0
            });
        } catch (error) {
            console.error('handleGetSelectedText 出错:', error);
            safeSendResponse(sendResponse, {
                success: false,
                error: 'handleGetSelectedText 出错: ' + error.message,
                text: ''
            });
        }
    }

    handleGetTextForTranslation(sendResponse) {
        try {
            console.log('处理 getTextForTranslation 请求');
            
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';
            
            console.log('翻译文本长度:', selectedText.length);
            
            if (selectedText.length > 0) {
                safeSendResponse(sendResponse, {
                    success: true,
                    text: selectedText,
                    type: 'selection',
                    source: '选中文本'
                });
            } else {
                // 不再自动获取页面内容，直接返回空文本
                safeSendResponse(sendResponse, {
                    success: true,
                    text: '',
                    type: 'empty',
                    source: '无选中文本'
                });
            }
        } catch (error) {
            console.error('handleGetTextForTranslation 出错:', error);
            safeSendResponse(sendResponse, {
                success: false,
                error: 'handleGetTextForTranslation 出错: ' + error.message,
                text: ''
            });
        }
    }


}

// 安全初始化
try {
    console.log('开始安全初始化 Content Script v2.0');
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM 加载完成，初始化 ContentManager');
            new SimpleContentManager();
        });
    } else {
        console.log('DOM 已加载，直接初始化 ContentManager');
        new SimpleContentManager();
    }
    
    console.log('Content Script v2.0 加载完成');
} catch (error) {
    console.error('Content Script v2.0 初始化失败:', error);
}

// 防止重复加载
if (!window.contentScriptLoaded) {
    window.contentScriptLoaded = true;
    console.log('Content Script v2.0 标记为已加载');
} else {
    console.warn('Content Script v2.0 重复加载');
}
