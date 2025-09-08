// Content Script - 注入到网页中运行
console.log('Content script loaded');

// 监听来自sidebar的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  // 检查扩展上下文是否有效
  if (chrome.runtime?.id) {
    if (request.action === 'getTextForTranslation') {
      try {
        // 获取选中的文本
        const selectedText = window.getSelection().toString();
        
        if (selectedText.trim()) {
          sendResponse({ success: true, text: selectedText });
        } else {
          // 如果没有选中文本，获取页面主要内容
          const article = document.querySelector('article') || 
                         document.querySelector('[role="main"]') || 
                         document.querySelector('.content') ||
                         document.body;
          
          if (article) {
            sendResponse({ success: true, text: article.innerText || article.textContent || '' });
          } else {
            sendResponse({ success: false, error: '未找到页面内容' });
          }
        }
      } catch (error) {
        console.error('获取文本时出错:', error);
        sendResponse({ success: false, error: '获取文本失败: ' + error.message });
      }
    } else if (request.action === 'getFullText') {
      try {
        // 获取页面全文内容
        const article = document.querySelector('article') || 
                       document.querySelector('[role="main"]') || 
                       document.querySelector('.content') ||
                       document.querySelector('main') ||
                       document.body;
        
        if (article) {
          // 移除脚本和样式元素
          const clone = article.cloneNode(true);
          clone.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
          sendResponse({ success: true, text: clone.innerText || clone.textContent || '' });
        } else {
          sendResponse({ success: false, error: '未找到页面内容' });
        }
      } catch (error) {
        console.error('获取全文时出错:', error);
        sendResponse({ success: false, error: '获取全文失败: ' + error.message });
      }
    }
    
    // 返回true表示异步响应
    return true;
  } else {
    // 扩展上下文已失效
    console.log('Extension context invalidated');
    return false;
  }
});

// 监听文本选择变化事件
document.addEventListener('selectionchange', () => {
  // 检查扩展上下文是否有效
  if (chrome.runtime?.id) {
    // 添加一个小延迟以确保选择操作完成
    setTimeout(() => {
      const selectedText = window.getSelection().toString();
      
      // 无论是否有选中文本都发送消息到插件界面
      chrome.runtime.sendMessage({
        action: "displayText",
        text: selectedText
      }).catch(error => {
        // 忽略错误，因为可能sidebar尚未打开
        console.log('发送文本到插件界面失败:', error);
      });
    }, 50);
  }
});

// Content Script - 在网页中运行的脚本
class ContentManager {
    constructor() {
        this.init();
    }

    init() {
        // 监听来自popup和sidepanel的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开放
        });
        
        // 使用selectionchange事件监听文本选择变化
        document.addEventListener('selectionchange', () => {
            // 增加小延迟确保选择完成
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                // 添加调试信息
                console.log('Selection change detected. Selected text length:', selectedText.length);
                console.log('Selected text content:', selectedText);
                
                // 发送消息到sidebar（无论是否有选中文本）
                chrome.runtime.sendMessage({
                    action: "displayText",
                    text: selectedText
                }).then(() => {
                    console.log('Successfully sent text to sidebar');
                }).catch(err => {
                    // 记录错误但不中断
                    console.error('Failed to send selected text to sidebar:', err);
                });
            }, 50); // 50ms延迟确保选择操作完成
        });
    }

    // 处理消息
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'ping':
                // 用于检查content script是否可用
                sendResponse({ success: true, message: 'Content script is ready' });
                break;
            case 'getSelectedText':
                this.getSelectedText(sendResponse);
                break;
            case 'getTextForTranslation':
                this.getTextForTranslation(sendResponse);
                break;
            case 'getPageContent':
                this.getPageContent(sendResponse);
                break;
            default:
                sendResponse({ error: '未知的操作类型' });
        }
    }

    // 获取选中的文本
    getSelectedText(sendResponse) {
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            sendResponse({
                success: true,
                text: selectedText,
                hasSelection: selectedText.length > 0
            });
        } catch (error) {
            console.error('获取选中文本失败:', error);
            sendResponse({
                success: false,
                error: error.message,
                text: ''
            });
        }
    }

    // 获取用于翻译的文本（优先选中文本，否则获取页面内容）
    getTextForTranslation(sendResponse) {
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText.length > 0) {
                // 有选中文本，返回选中的内容
                sendResponse({
                    success: true,
                    text: selectedText,
                    type: 'selection',
                    source: '选中文本'
                });
            } else {
                // 没有选中文本，获取页面主要内容
                const pageText = this.extractPageContent();
                sendResponse({
                    success: true,
                    text: pageText,
                    type: 'page',
                    source: '整页内容'
                });
            }
        } catch (error) {
            console.error('获取翻译文本失败:', error);
            sendResponse({
                success: false,
                error: error.message,
                text: ''
            });
        }
    }

    // 获取页面内容
    getPageContent(sendResponse) {
        try {
            const pageText = this.extractPageContent();
            sendResponse({
                success: true,
                text: pageText,
                type: 'page'
            });
        } catch (error) {
            console.error('获取页面内容失败:', error);
            sendResponse({
                success: false,
                error: error.message,
                text: ''
            });
        }
    }

    // 提取页面主要文本内容
    extractPageContent() {
        // 尝试多种方法提取页面主要内容
        let content = '';
        
        // 方法1: 尝试获取文章内容
        const articleSelectors = [
            'article',
            '[role="main"]',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.main-content',
            '#content',
            '#main'
        ];
        
        for (const selector of articleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content = this.extractTextFromElement(element);
                if (content.length > 100) { // 如果内容足够长，就使用这个
                    break;
                }
            }
        }
        
        // 方法2: 如果没有找到合适的内容，尝试获取body中的文本
        if (content.length < 100) {
            const bodyElement = document.body;
            if (bodyElement) {
                content = this.extractTextFromElement(bodyElement);
            }
        }
        
        // 方法3: 最后的备选方案，获取页面标题和描述
        if (content.length < 50) {
            const title = document.title || '';
            const metaDescription = this.getMetaDescription();
            content = [title, metaDescription].filter(text => text.length > 0).join('\n\n');
        }
        
        // 清理和格式化文本
        content = this.cleanText(content);
        
        return content;
    }

    // 从元素中提取文本
    extractTextFromElement(element) {
        try {
            // 克隆元素以避免修改原始DOM
            const clonedElement = element.cloneNode(true);
            
            // 移除不需要的元素
            const unwantedSelectors = [
                'script',
                'style',
                'nav',
                'header',
                'footer',
                '.navigation',
                '.menu',
                '.sidebar',
                '.advertisement',
                '.ads',
                '.social-share',
                '.comments',
                '.related-posts'
            ];
            
            unwantedSelectors.forEach(selector => {
                const elements = clonedElement.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });
            
            // 获取文本内容
            let text = clonedElement.textContent || clonedElement.innerText || '';
            
            return text;
        } catch (e) {
            console.error('Error extracting text from element:', e);
            return '';
        }
    }

    // 获取页面描述
    getMetaDescription() {
        try {
            const metaDescription = document.querySelector('meta[name="description"]');
            return metaDescription ? metaDescription.getAttribute('content') || '' : '';
        } catch (e) {
            console.error('Error getting meta description:', e);
            return '';
        }
    }

    // 清理文本
    cleanText(text) {
        try {
            return text
                // 移除多余的空白字符
                .replace(/\s+/g, ' ')
                // 移除行首行尾空白
                .replace(/^\s+|\s+$/gm, '')
                // 移除多余的换行
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                // 移除特殊字符
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .trim();
        } catch (e) {
            console.error('Error cleaning text:', e);
            return text;
        }
    }
}

// 初始化Content Manager
const contentManager = new ContentManager();

console.log('智能翻译助手 Content Script 已加载');
