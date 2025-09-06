document.addEventListener('DOMContentLoaded', function() {
  const translateBtn = document.getElementById('translateBtn');
  
  translateBtn.addEventListener('click', async function() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 发送消息到content script获取选中文本
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });
      
      // 获取选中文本
      const selectedText = response?.text || '';
      
      // 发送消息到background script进行翻译
      chrome.runtime.sendMessage({
        action: "translate",
        text: selectedText,
        sourceLang: "zh",
        targetLang: "en"
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          return;
        }
        
        // 打开侧边栏显示结果
        chrome.sidePanel.open({ windowId: tab.windowId });
      });
    } catch (error) {
      console.error('Translation error:', error);
    }
  });
});