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