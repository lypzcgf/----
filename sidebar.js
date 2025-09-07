document.addEventListener('DOMContentLoaded', async function() {
  // 获取DOM元素
  const sourceLangSelect = document.getElementById('sourceLang');
  const targetLangSelect = document.getElementById('targetLang');
  const translateBtn = document.getElementById('translateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const translationResult = document.getElementById('translationResult');
  
  // 新增：获取网页原文元素
  const originalText = document.getElementById('originalText');
  
  // 统计信息元素
  const translationTimeEl = document.getElementById('translationTime');
  const charCountEl = document.getElementById('charCount');
  const wordCountEl = document.getElementById('wordCount');
  const paragraphCountEl = document.getElementById('paragraphCount');
  const lineCountEl = document.getElementById('lineCount');
  
  // 大模型选择元素
  const modelSelect = document.getElementById('modelSelect');
  
  // API Key相关元素
  const apiKeyInput = document.getElementById('apiKeyInput');
  const deepseekApiKeyInput = document.getElementById('deepseekApiKeyInput');
  const qwenApiKeyInput = document.getElementById('qwenApiKeyInput');
  const doubaoApiKeyInput = document.getElementById('doubaoApiKeyInput');
  
  // Base URL相关元素
  const kimiBaseUrl = document.getElementById('kimiBaseUrl');
  const deepseekBaseUrl = document.getElementById('deepseekBaseUrl');
  const qwenBaseUrl = document.getElementById('qwenBaseUrl');
  const doubaoBaseUrl = document.getElementById('doubaoBaseUrl');
  
  // 模型端点相关元素
  const kimiModelEndpoint = document.getElementById('kimiModelEndpoint');
  const deepseekModelEndpoint = document.getElementById('deepseekModelEndpoint');
  const qwenModelEndpoint = document.getElementById('qwenModelEndpoint');
  const doubaoModelEndpoint = document.getElementById('doubaoModelEndpoint');
  
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const saveDeepseekBtn = document.getElementById('saveDeepseekBtn');
  const testDeepseekBtn = document.getElementById('testDeepseekBtn');
  const saveQwenBtn = document.getElementById('saveQwenBtn');
  const testQwenBtn = document.getElementById('testQwenBtn');
  const saveDoubaoBtn = document.getElementById('saveDoubaoBtn');
  const testDoubaoBtn = document.getElementById('testDoubaoBtn');
  const debugBtn = document.getElementById('debugBtn');
  const logBtn = document.getElementById('logBtn');
  
  // 新增：复制原文按钮
  const copyOriginalBtn = document.getElementById('copyOriginalBtn');
  
  // 页面加载时尝试获取当前页面选中的文本
  let currentText = '';
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "displayResult") {
      displayTranslationResult(message.result);
      sendResponse({ success: true });
    } else if (message.action === "displayText") {
      currentText = message.text;
      // 更新网页原文显示
      originalText.textContent = message.text;
      // 添加调试信息
      console.log('Received text from content script:', message.text);
      sendResponse({ success: true });
    }
    return true;
  });
  
  // 监听大模型选择变化
  modelSelect.addEventListener('change', async function() {
    const selectedModel = modelSelect.value;
    
    // 显示对应的API Key配置区域
    document.getElementById('kimiApiKeySection').style.display = 
      selectedModel === 'kimi' ? 'block' : 'none';
    document.getElementById('deepseekApiKeySection').style.display = 
      selectedModel === 'deepseek' ? 'block' : 'none';
    document.getElementById('qwenApiKeySection').style.display = 
      selectedModel === 'qwen' ? 'block' : 'none';
    document.getElementById('doubaoApiKeySection').style.display = 
      selectedModel === 'doubao' ? 'block' : 'none';
    
    // 加载对应模型的API Key和配置
    loadModelConfig(selectedModel);
  });
  
  // 加载模型配置
  async function loadModelConfig(model) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "loadModelConfig",
        model: model
      });
      
      if (response.success) {
        const config = response.config;
        
        if (model === 'kimi') {
          apiKeyInput.value = config.apiKey || '';
          kimiBaseUrl.value = config.baseUrl || '';
          kimiModelEndpoint.value = config.modelEndpoint || '';
        } else if (model === 'deepseek') {
          deepseekApiKeyInput.value = config.apiKey || '';
          deepseekBaseUrl.value = config.baseUrl || '';
          deepseekModelEndpoint.value = config.modelEndpoint || '';
        } else if (model === 'qwen') {
          qwenApiKeyInput.value = config.apiKey || '';
          qwenBaseUrl.value = config.baseUrl || '';
          qwenModelEndpoint.value = config.modelEndpoint || '';
        } else if (model === 'doubao') {
          doubaoApiKeyInput.value = config.apiKey || '';
          doubaoBaseUrl.value = config.baseUrl || '';
          doubaoModelEndpoint.value = config.modelEndpoint || '';
        }
      }
    } catch (error) {
      console.error(`Failed to load ${model} config:`, error);
    }
  }

  // 保存Kimi API Key
  saveBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    const baseUrl = kimiBaseUrl.value.trim();
    const modelEndpoint = kimiModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        await chrome.runtime.sendMessage({
            action: "saveApiKey",
            model: 'kimi',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        alert('Kimi API Key、Base URL和模型端点保存成功！');
    } catch (error) {
        console.error('Failed to save Kimi API Key:', error);
        alert('保存失败: ' + error.message);
    }
  });
  
  // 保存DeepSeek API Key
  saveDeepseekBtn.addEventListener('click', async function() {
    const apiKey = deepseekApiKeyInput.value.trim();
    const baseUrl = deepseekBaseUrl.value.trim();
    const modelEndpoint = deepseekModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        await chrome.runtime.sendMessage({
            action: "saveApiKey",
            model: 'deepseek',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        alert('DeepSeek API Key、Base URL和模型端点保存成功！');
    } catch (error) {
        console.error('Failed to save DeepSeek API Key:', error);
        alert('保存失败: ' + error.message);
    }
  });
  
  // 保存Qwen API Key
  saveQwenBtn.addEventListener('click', async function() {
    const apiKey = qwenApiKeyInput.value.trim();
    const baseUrl = qwenBaseUrl.value.trim();
    const modelEndpoint = qwenModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        await chrome.runtime.sendMessage({
            action: "saveApiKey",
            model: 'qwen',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        alert('Qwen API Key、Base URL和模型端点保存成功！');
    } catch (error) {
        console.error('Failed to save Qwen API Key:', error);
        alert('保存失败: ' + error.message);
    }
  });
  
  // 保存Doubao API Key、Base URL和模型端点
  saveDoubaoBtn.addEventListener('click', async function() {
    const apiKey = doubaoApiKeyInput.value.trim();
    const baseUrl = doubaoBaseUrl.value.trim();
    const modelEndpoint = doubaoModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        await chrome.runtime.sendMessage({
            action: "saveApiKey",
            model: 'doubao',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        alert('Doubao API Key、Base URL和模型端点保存成功！');
    } catch (error) {
        console.error('Failed to save Doubao API Key:', error);
        alert('保存失败: ' + error.message);
    }
  });

  // 测试Kimi API连接
  testBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    const baseUrl = kimiBaseUrl.value.trim();
    const modelEndpoint = kimiModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        const result = await chrome.runtime.sendMessage({
            action: "testConnection",
            model: 'kimi',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        if (result.success) {
            alert('Kimi连接成功！' + result.message);
        } else {
            alert('Kimi连接失败: ' + result.message);
        }
    } catch (error) {
        console.error('Test Kimi connection failed:', error);
        alert('测试Kimi连接失败: ' + error.message);
    }
  });
  
  // 测试DeepSeek API连接
  testDeepseekBtn.addEventListener('click', async function() {
    const apiKey = deepseekApiKeyInput.value.trim();
    const baseUrl = deepseekBaseUrl.value.trim();
    const modelEndpoint = deepseekModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        const result = await chrome.runtime.sendMessage({
            action: "testConnection",
            model: 'deepseek',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        if (result.success) {
            alert('DeepSeek连接成功！' + result.message);
        } else {
            alert('DeepSeek连接失败: ' + result.message);
        }
    } catch (error) {
        console.error('Test DeepSeek connection failed:', error);
        alert('测试DeepSeek连接失败: ' + error.message);
    }
  });
  
  // 测试Qwen API连接
  testQwenBtn.addEventListener('click', async function() {
    const apiKey = qwenApiKeyInput.value.trim();
    const baseUrl = qwenBaseUrl.value.trim();
    const modelEndpoint = qwenModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        const result = await chrome.runtime.sendMessage({
            action: "testConnection",
            model: 'qwen',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        if (result.success) {
            alert('Qwen连接成功！' + result.message);
        } else {
            alert('Qwen连接失败: ' + result.message);
        }
    } catch (error) {
        console.error('Test Qwen connection failed:', error);
        alert('测试Qwen连接失败: ' + error.message);
    }
  });
  
  // 测试Doubao API连接
  testDoubaoBtn.addEventListener('click', async function() {
    const apiKey = doubaoApiKeyInput.value.trim();
    const baseUrl = doubaoBaseUrl.value.trim();
    const modelEndpoint = doubaoModelEndpoint.value.trim();
    
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    if (!baseUrl) {
        alert('请输入Base URL');
        return;
    }
    
    if (!modelEndpoint) {
        alert('请输入模型端点');
        return;
    }
    
    try {
        const result = await chrome.runtime.sendMessage({
            action: "testConnection",
            model: 'doubao',
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        });
        
        if (result.success) {
            alert('Doubao连接成功！' + result.message);
        } else {
            alert('Doubao连接失败: ' + result.message);
        }
    } catch (error) {
        console.error('Test Doubao connection failed:', error);
        alert('测试Doubao连接失败: ' + error.message);
    }
  });

  // 开启调试
  debugBtn.addEventListener('click', function() {
    // 这里可以添加调试功能
    console.log('Debug mode enabled');
    alert('调试模式已开启');
  });

  // 导出日志
  logBtn.addEventListener('click', function() {
    // 这里可以添加导出日志功能
    console.log('Exporting logs...');
    alert('日志导出功能暂未实现');
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
    const selectedModel = modelSelect.value; // 获取选择的大模型
    
    // 每次点击翻译按钮时都重新获取当前选中的文本
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 获取文本
      currentText = await getTextWithFallback(tab.id);
    } catch (error) {
      console.error('Error getting page text:', error);
      translationResult.textContent = error.message || '获取页面内容失败';
      return;
    }
    
    if (!currentText.trim()) {
      translationResult.textContent = '没有可翻译的文本内容';
      return;
    }
    
    // 更新网页原文显示
    originalText.textContent = currentText;
    
    // 显示正在翻译状态
    translateBtn.textContent = '🔄 翻译中...';
    translateBtn.disabled = true;
    
    try {
      // 发送翻译请求到background script
      const response = await chrome.runtime.sendMessage({
        action: "translate",
        text: currentText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        model: selectedModel // 传递选择的大模型
      });
      
      // 检查响应
      if (!response || !response.success) {
        throw new Error(response?.error || '翻译请求失败');
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // 对429错误提供更友好的提示
      let errorMessage = error.message || '未知错误';
      if (errorMessage.includes('429')) {
        errorMessage = '请求过于频繁，请稍后再试（API速率限制）';
      }
      
      translationResult.textContent = `翻译失败: ${errorMessage}`;
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
  
  // 新增：复制原文按钮点击事件
  copyOriginalBtn.addEventListener('click', function() {
    const textToCopy = originalText.textContent;
    if (textToCopy && textToCopy !== '点击“开始翻译”按钮来查看选中的文本') {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = copyOriginalBtn.textContent;
          copyOriginalBtn.textContent = '✅ 已复制';
          setTimeout(() => {
            copyOriginalBtn.textContent = originalText;
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
      // 对429错误提供更友好的提示
      let errorMessage = result.error;
      if (errorMessage.includes('429')) {
        errorMessage = '请求过于频繁，请稍后再试（API速率限制）';
      }
      translationResult.textContent = `翻译失败: ${errorMessage}`;
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

  // 页面加载完成后加载API Key和模型版本
  loadModelConfig('kimi'); // 默认加载Kimi的API Key
});