document.addEventListener('DOMContentLoaded', async function() {
  // 获取DOM元素
  const sourceLangSelect = document.getElementById('sourceLang');
  const targetLangSelect = document.getElementById('targetLang');
  const translateBtn = document.getElementById('translateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const translationResult = document.getElementById('translationResult');
  
  // 统计信息元素
  const translationTimeEl = document.getElementById('translationTime');
  const charCountEl = document.getElementById('charCount');
  const wordCountEl = document.getElementById('wordCount');
  const paragraphCountEl = document.getElementById('paragraphCount');
  const lineCountEl = document.getElementById('lineCount');
  
  // 页面加载时尝试获取当前页面选中的文本
  let currentText = '';
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "displayResult") {
      displayTranslationResult(message.result);
      sendResponse({ success: true });
    } else if (message.action === "displayText") {
      currentText = message.text;
      sendResponse({ success: true });
    }
    return true;
  });
  
  // 获取文本的函数（带备选方案）
  async function getTextWithFallback(tabId) {
    try {
      // 首先尝试通过消息传递获取选中的文本
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'getTextForTranslation'
      });
      
      if (response && response.success) {
        return response.text;
      } else {
        throw new Error(response ? response.error : '无法与页面通信');
      }
    } catch (error) {
      console.error('通过消息传递获取文本失败:', error);
      
      // 备选方案：直接执行脚本获取文本
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const selectedText = window.getSelection().toString();
            if (selectedText.trim()) {
              return selectedText;
            }
            
            // 如果没有选中文本，获取页面主要内容
            const article = document.querySelector('article') || 
                           document.querySelector('[role="main"]') || 
                           document.querySelector('.content') ||
                           document.body;
            
            if (article) {
              return article.innerText || article.textContent || '';
            }
            
            return '';
          }
        });
        
        if (results && results[0] && results[0].result) {
          return results[0].result;
        }
      } catch (scriptError) {
        console.error('通过脚本注入获取文本失败:', scriptError);
      }
      
      // 最后的备选方案：使用已存储的文本
      if (currentText) {
        return currentText;
      }
      
      throw new Error('无法获取页面文本内容');
    }
  }
  
  // 翻译按钮点击事件
  translateBtn.addEventListener('click', async function() {
    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;
    
    // 如果没有当前文本，则获取整个页面的文本
    if (!currentText || !currentText.trim()) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 获取文本
        currentText = await getTextWithFallback(tab.id);
      } catch (error) {
        console.error('Error getting page text:', error);
        translationResult.textContent = error.message || '获取页面内容失败';
        return;
      }
    }
    
    if (!currentText.trim()) {
      translationResult.textContent = '没有可翻译的文本内容';
      return;
    }
    
    // 显示正在翻译状态
    translateBtn.textContent = '🔄 翻译中...';
    translateBtn.disabled = true;
    
    try {
      // 发送翻译请求到background script
      const response = await chrome.runtime.sendMessage({
        action: "translate",
        text: currentText,
        sourceLang: sourceLang,
        targetLang: targetLang
      });
      
      // 检查响应
      if (!response || !response.success) {
        throw new Error(response?.error || '翻译请求失败');
      }
    } catch (error) {
      console.error('Translation error:', error);
      translationResult.textContent = `翻译失败: ${error.message || '未知错误'}`;
      resetTranslateButton();
    }
  });
  
  // 复制按钮点击事件
  copyBtn.addEventListener('click', function() {
    const textToCopy = translationResult.textContent;
    if (textToCopy && textToCopy !== '没有可翻译的文本内容' && textToCopy !== '翻译失败，请稍后重试') {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '✅ 已复制';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  });
  
  
  // 显示翻译结果
  function displayTranslationResult(result) {
    resetTranslateButton();
    
    if (result.error) {
      translationResult.textContent = `翻译失败: ${result.error}`;
      return;
    }
    
    // 显示翻译结果
    translationResult.textContent = result.text || '无翻译结果';
    
    // 更新统计信息
    translationTimeEl.textContent = result.translationTime ? `${result.translationTime}秒` : '-';
    charCountEl.textContent = result.characterCount || '-';
    wordCountEl.textContent = result.wordCount || '-';
    paragraphCountEl.textContent = result.paragraphCount || '-';
    lineCountEl.textContent = result.lineCount || '-';
  }
  
  // 重置翻译按钮状态
  function resetTranslateButton() {
    translateBtn.textContent = '🔄 开始翻译';
    translateBtn.disabled = false;
  }
});