// 监听大模型选择变化
modelSelect.addEventListener('change', async function() {
    const selectedModel = modelSelect.value;
    
    // 保存选择的模型
    await chrome.storage.local.set({ selectedModel: selectedModel });
    
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

function displayTranslationResult(result) {
    if (result.error) {
        translationResult.textContent = '翻译失败: ' + result.error;
        translationResult.style.color = '#dc3545';
        return;
    }
    
    // 更新翻译结果
    translationResult.textContent = result.text;
    translationResult.style.color = 'black';
    
    // 更新统计信息
    translationTimeEl.textContent = result.translationTime;
    charCountEl.textContent = result.characterCount;
    wordCountEl.textContent = result.wordCount;
    paragraphCountEl.textContent = result.paragraphCount;
    lineCountEl.textContent = result.lineCount;
    
    // 保存当前翻译结果到全局变量
    window.currentTranslationResult = {
        originalText: currentText,
        resultText: result.text,
        sourceLang: result.detectedLanguage || result.sourceLang,
        targetLang: result.targetLang,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        url: document.location.href,
        title: document.title
    };
    
    // 显示同步按钮
    syncTranslationBtn.style.display = 'inline-block';
}
