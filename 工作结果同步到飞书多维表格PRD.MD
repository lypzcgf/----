# 工作结果同步到飞书多维表格 PRD

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 工作结果同步到飞书多维表格 |
| 文档版本 | 1.0 |
| 创建日期 | 2025-09-08 |
| 作者 | 产品团队 |
| 审核人 | 技术团队 |

## 2. 概述

### 2.1 项目背景
随着用户使用上网助手插件进行文本翻译和改写操作的增加，用户希望能够将处理过的内容进行持久化存储和管理，以便后续查阅和分析。飞书多维表格作为一个功能强大的协作工具，可以很好地满足用户对内容存储和管理的需求。

### 2.2 目标
开发一个功能，将用户的原文、翻译结果和改写结果自动同步到飞书多维表格中，方便用户进行内容管理和分析。

### 2.3 范围
本功能主要包括：
1. 将每次获取的原文和翻译结果存储到飞书多维表格
2. 将每次获取的原文和改写结果存储到飞书多维表格

## 3. 功能需求

### 3.1 核心功能

#### 3.1.1 原文与翻译结果同步
- 功能描述：用户完成翻译操作后，系统自动将原文和翻译结果同步到飞书多维表格
- 触发条件：用户点击"同步翻译结果"按钮。"同步翻译结果"按钮开始是灰色，用户点击"开始翻译"并成功获取翻译结果后"同步翻译结果"按钮变为蓝色，表示可以同步。"同步翻译结果"按钮的位置在"开始翻译"按钮右边。
- 同步内容：
  - 原文内容
  - 翻译结果
  - 源语言
  - 目标语言
  - 使用的大模型
  - 操作时间
  - 页面URL
  - 页面标题

#### 3.1.2 原文与改写结果同步
- 功能描述：用户完成改写操作后，系统自动将原文和改写结果同步到飞书多维表格
- 触发条件：用户点击"同步改写结果"按钮。"同步改写结果"按钮开始是灰色，用户点击"开始改写"并成功获取翻译结果后"同步改写结果"按钮变为蓝色，表示可以同步。"同步改写结果"按钮的位置在"开始改写"按钮右边。
- 同步内容：
  - 原文内容
  - 改写结果
  - 改写提示词
  - 使用的大模型
  - 操作时间
  - 页面URL
  - 页面标题

### 3.2 配置功能

#### 3.2.1 飞书多维表格配置
- 功能描述：用户可以配置飞书多维表格的相关参数
- 配置项：
  - 飞书应用ID
  - 飞书应用密钥   
  - 多维表格Token
  - 数据表ID
  - 表格字段映射配置

#### 3.2.2 同步开关设置
- 功能描述：用户可以控制是否开启同步功能（后续可引导收费，付费成员才可以开启相关同步功能）
- 配置项：
  - 翻译结果同步开关
  - 改写结果同步开关

### 3.3 数据管理功能

#### 3.3.1 数据查看
- 功能描述：用户可以在插件界面查看已同步的数据记录
- 展示内容：
  - 同步历史记录列表
  - 每条记录的基本信息（时间、原文预览、操作类型等）

#### 3.3.2 数据导出
- 功能描述：用户可以将同步的数据导出为本地文件
- 支持格式：CSV、JSON

#### 3.3.3 数据删除
- 功能描述：用户可以删除已同步的历史记录
- 操作方式：
  - 支持单条记录删除
  - 支持批量删除选中记录
  - 支持清空所有历史记录
- 删除范围：
  - 仅删除本地历史记录
  - 可选择是否同时删除飞书多维表格中的对应记录

#### 3.3.4 数据修改
- 功能描述：用户可以修改已同步记录的内容
- 可修改字段：
  - 原文内容
  - 翻译/改写结果
  - 标签或分类信息
  - 备注信息
- 同步机制：
  - 修改后的数据可选择是否重新同步到飞书多维表格
  - 支持手动触发同步更新

## 4. 非功能需求

### 4.1 性能需求
- 数据同步响应时间：不超过3秒
- 本地数据查询响应时间：不超过1秒

### 4.2 安全需求
- 用户的飞书API令牌需要加密存储
- 数据传输过程需要使用HTTPS加密
- 用户敏感信息不得明文存储

### 4.3 可用性需求
- 提供清晰的错误提示信息
- 在网络异常情况下提供重试机制
- 支持断点续传功能

### 4.4 兼容性需求
- 支持主流浏览器（Chrome、Edge等）
- 兼容飞书多维表格API v2.0版本

## 5. 用户界面设计

### 5.1 配置界面
在现有大模型配置区域下方添加飞书多维表格配置区域：

```
+--------------------------------------------------+
| 飞书多维表格配置                                 |
|                                                  |
| [ ] 启用飞书多维表格同步                         |
|                                                  |
| 飞书应用ID: [文本输入框]                         |
| 飞书应用密钥: [密码输入框]                       |
| 多维表格Token: [文本输入框]                      |
|                                                  |
| [保存配置] [测试连接]                           |
+--------------------------------------------------+
```

配置说明：
1. 启用飞书多维表格同步：复选框，控制是否开启同步功能
2. 飞书应用ID：在飞书开放平台创建的应用ID
3. 飞书应用密钥：用户在飞书开放平台获取的个人访问令牌，需要加密存储
4. 多维表格Token：飞书多维表格应用的唯一标识
5. 保存配置：保存用户输入的配置信息
6. 测试连接：验证配置是否正确，能否连接到飞书多维表格

### 5.2 数据管理界面
在配置界面下方添加数据管理区域：

```
+--------------------------------------------------+
| 同步数据管理                                     |
|                                                  |
| [搜索框]                                         |
| [筛选条件: 全部 翻译 改写]                       |
|                                                  |
| 数据记录列表:                                    |
| [记录1] 原文预览... [2025-09-08 10:30] [编辑] [删除]|
| [记录2] 原文预览... [2025-09-08 09:15] [编辑] [删除]|
| ...                                              |
|                                                  |
| [批量删除] [导出数据] [清空所有记录]             |
+--------------------------------------------------+
```

记录详情弹窗：
```
+--------------------------------------------------+
| 编辑记录                                         |
|                                                  |
| 原文内容:                                        |
| [多行文本输入框]                                 |
|                                                  |
| 结果内容:                                        |
| [多行文本输入框]                                 |
|                                                  |
| 标签: [文本输入框]                               |
| 备注: [文本输入框]                               |
|                                                  |
| [保存] [取消] [删除]                            |
+--------------------------------------------------+
```

### 5.2 同步状态显示
在结果区域添加同步状态指示：

```
翻译结果:
[翻译内容显示区域]

同步状态: [✅ 已同步] [🔄 同步中] [❌ 同步失败]
[查看同步记录]
```

## 6. 技术实现方案

### 6.1 数据结构设计

#### 6.1.1 本地存储结构
```javascript
{
  "feishuConfig": {
    "enabled": true,
    "appId": "string",
    "appSecret": "加密存储",
    "bitableToken": "string"
  },
  "syncHistory": [
    {
      "id": "string",
      "type": "translation|rewrite",
      "originalText": "string",
      "resultText": "string",
      "sourceLang": "string",
      "targetLang": "string",
      "model": "string",
      "prompt": "string",
      "timestamp": "datetime",
      "url": "string",
      "syncStatus": "pending|success|failed",
      "feishuRecordId": "string",
      "isDeleted": "boolean",           // 用于标记软删除状态
      "lastModified": "datetime",       // 记录最后修改时间
      "tags": ["string"],              // 用户自定义标签
      "notes": "string"                // 用户备注信息
    }
  ]
}
```

#### 6.1.2 飞书多维表格字段设计
翻译数据表字段：
- 原文内容 (文本)
- 翻译结果 (文本)
- 源语言 (单选)
- 目标语言 (单选)
- 使用模型 (单选)
- 操作时间 (日期时间)
- 页面URL (链接)
- 同步时间 (日期时间)
- 标签 (多选)
- 备注 (文本)
- 最后修改时间 (日期时间)
- 软删除标记 (复选框)

改写数据表字段：
- 原文内容 (文本)
- 改写结果 (文本)
- 改写提示词 (文本)
- 使用模型 (单选)
- 操作时间 (日期时间)
- 页面URL (链接)
- 同步时间 (日期时间)
- 标签 (多选)
- 备注 (文本)
- 最后修改时间 (日期时间)
- 软删除标记 (复选框)

### 6.2 API接口设计

#### 6.2.1 飞书多维表格API调用

**获取飞书访问令牌的URL：**
```
https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
```

这个URL用于获取飞书的租户访问令牌（tenant_access_token），通过POST请求发送app_id和app_secret来获取访问令牌。

**其他相关的飞书API链接：**

1. **飞书开放平台主页：** `https://open.feishu.cn/`
2. **多维表格相关API：**
   - 获取表格信息：`https://open.feishu.cn/open-apis/bitable/v1/apps/{tableToken}/tables/{tableId}`
   - 创建记录：`https://open.feishu.cn/open-apis/bitable/v1/apps/{tableToken}/tables/{tableId}/records`
   - 更新记录：`https://open.feishu.cn/open-apis/bitable/v1/apps/{tableToken}/tables/{tableId}/records/{recordId}`
   - 删除记录：`https://open.feishu.cn/open-apis/bitable/v1/apps/{tableToken}/tables/{tableId}/records/{recordId}`

3. **文档链接：**
   - 飞书开放平台文档：`https://open.feishu.cn/document/`
   - 飞书多维表格API文档：`https://open.feishu.cn/document/server-docs/docs/bitable-v1/`

4.参考代码示例：
```javascript
// 测试飞书连接
async function testFeishuConnection(config) {
  try {
    if (!config.appId || !config.appSecret) {
      throw new Error('请提供完整的飞书应用配置');
    }
    
    const accessToken = await getFeishuAccessToken(config.appId, config.appSecret);
    
    if (config.tableToken && config.tableId) {
      // 测试表格访问
      await testTableAccess(accessToken, config.tableToken, config.tableId);
    }
    
    return { connected: true, message: '连接成功' };
  } catch (error) {
    console.error('飞书连接测试失败:', error);
    throw error;
  }
}

// 获取飞书访问令牌
async function getFeishuAccessToken(appId, appSecret) {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });
    
    const data = await response.json();
    
    if (data.code === 0) {
      return data.tenant_access_token;
    } else {
      throw new Error(data.msg || '获取访问令牌失败');
    }
  } catch (error) {
    console.error('获取飞书访问令牌失败:', error);
    throw error;
  }
}

// 测试表格访问权限
async function testTableAccess(accessToken, tableToken, tableId) {
  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${tableToken}/tables/${tableId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(data.msg || '表格访问失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('测试表格访问失败:', error);
    throw error;
  }
}

// 同步到飞书表格
async function syncToFeishu(bookmark, operation) {
  try {
    const result = await chrome.storage.local.get(['feishuConfig']);
    const config = result.feishuConfig;
    
    if (!config || !config.appId || !config.appSecret || !config.tableToken || !config.tableId) {
      console.warn('飞书配置不完整，跳过同步');
      return;
    }
    
    const accessToken = await getFeishuAccessToken(config.appId, config.appSecret);
    
    switch (operation) {
      case 'create':
        await createFeishuRecord(accessToken, config, bookmark);
        break;
      case 'update':
        await updateFeishuRecord(accessToken, config, bookmark);
        break;
      case 'delete':
        await deleteFeishuRecord(accessToken, config, bookmark);
        break;
    }
  } catch (error) {
    console.error('飞书同步失败:', error);
    throw error;
  }
}

// 创建飞书记录
async function createFeishuRecord(accessToken, config, bookmark) {
  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          '标题': bookmark.title,
          '网址': bookmark.url,
          '标签': bookmark.tags ? bookmark.tags.join(', ') : '',
          '备注': bookmark.notes || '',
          '创建时间': bookmark.createdAt
        }
      })
    });
    
    const data = await response.json();
    
    if (data.code === 0) {
      // 保存飞书记录ID到本地
      bookmark.feishuRecordId = data.data.record.record_id;
      
      const result = await chrome.storage.local.get(['bookmarks']);
      const bookmarks = result.bookmarks || [];
      const index = bookmarks.findIndex(b => b.id === bookmark.id);
      
      if (index !== -1) {
        bookmarks[index].feishuRecordId = bookmark.feishuRecordId;
        await chrome.storage.local.set({ bookmarks });
      }
    } else {
      throw new Error(data.msg || '创建飞书记录失败');
    }
  } catch (error) {
    console.error('创建飞书记录失败:', error);
    throw error;
  }
}

// 更新飞书记录
async function updateFeishuRecord(accessToken, config, bookmark) {
  if (!bookmark.feishuRecordId) {
    console.warn('缺少飞书记录ID，跳过更新');
    return;
  }
  
  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records/${bookmark.feishuRecordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          '标题': bookmark.title,
          '网址': bookmark.url,
          '标签': bookmark.tags ? bookmark.tags.join(', ') : '',
          '备注': bookmark.notes || '',
          '更新时间': bookmark.updatedAt
        }
      })
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(data.msg || '更新飞书记录失败');
    }
  } catch (error) {
    console.error('更新飞书记录失败:', error);
    throw error;
  }
}

// 删除飞书记录
async function deleteFeishuRecord(accessToken, config, bookmark) {
  if (!bookmark.feishuRecordId) {
    console.warn('缺少飞书记录ID，跳过删除');
    return;
  }
  
  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records/${bookmark.feishuRecordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(data.msg || '删除飞书记录失败');
    }
  } catch (error) {
    console.error('删除飞书记录失败:', error);
    throw error;
  }
}

// 监听存储变化，用于数据同步
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('本地存储发生变化:', changes);
  }
});

// 处理插件卸载
chrome.runtime.onSuspend.addListener(() => {
  console.log('插件即将被挂起');
});

console.log('网页收藏夹后台服务已启动');
```           

#### 6.2.2 本地数据管理接口
- 保存配置：`chrome.storage.local.set()`
- 读取配置：`chrome.storage.local.get()`
- 保存同步记录：`chrome.storage.local.set()`
- 读取同步记录：`chrome.storage.local.get()`
- 更新同步记录：`chrome.storage.local.get()` + `chrome.storage.local.set()`
- 删除同步记录：`chrome.storage.local.remove()`
- 批量删除同步记录：`chrome.storage.local.remove()`

### 6.3 错误处理机制

#### 6.3.1 网络异常处理
- 实现指数退避重试机制
- 提供手动重试功能
- 记录失败原因便于排查

#### 6.3.2 权限错误处理
- 提供清晰的权限配置指引
- 检测配置有效性
- 提供测试连接功能

## 7. 项目计划

### 7.1 阶段一：基础功能开发 (7天)
- 第1天：飞书多维表格API集成
- 第2天：配置管理功能
- 第3天：翻译结果同步功能
- 第4天：改写结果同步功能
- 第5天：数据查看功能
- 第6天：数据导出功能
- 第7天：基础测试和调试

### 7.2 阶段二：增强功能开发 (4天)
- 第1天：同步状态管理
- 第2天：数据删除功能（单条删除、批量删除）
- 第3天：数据修改功能（内容编辑、标签备注）
- 第4天：错误处理和重试机制

### 7.3 阶段三：测试和优化 (3天)
- 第1天：功能测试和Bug修复
- 第2天：性能优化和用户体验优化
- 第3天：安全测试和文档完善

## 8. 风险评估

### 8.1 技术风险
- 飞书API接口变更风险
- 网络不稳定导致同步失败
- 数据量大时的性能问题
- 数据删除操作可能误删重要数据
- 数据修改并发冲突风险

### 8.2 应对措施
- 定期关注飞书API更新
- 实现完善的重试机制
- 添加数据分页加载功能
- 实现软删除机制和删除确认功能
- 添加数据版本控制和冲突解决机制

## 9. 验收标准

### 9.1 功能验收
- [ ] 飞书多维表格配置功能正常
- [ ] 翻译结果自动同步功能正常
- [ ] 改写结果自动同步功能正常
- [ ] 同步状态显示正确
- [ ] 错误处理机制有效
- [ ] 数据查看功能正常
- [ ] 数据导出功能正常（支持CSV、JSON格式）
- [ ] 数据删除功能正常（支持单条删除、批量删除、清空所有记录）
- [ ] 数据修改功能正常（支持内容编辑、标签备注）
- [ ] 软删除机制有效（可选择是否同时删除飞书多维表格中的对应记录）

### 9.2 性能验收
- [ ] 同步响应时间不超过3秒
- [ ] 本地数据查询响应时间不超过1秒
- [ ] 支持至少1000条历史记录
- [ ] 批量删除操作响应时间不超过5秒
- [ ] 数据修改同步响应时间不超过3秒

### 9.3 安全验收
- [ ] API令牌加密存储
- [ ] 数据传输使用HTTPS加密
- [ ] 无敏感信息明文存储
- [ ] 删除操作有确认机制
- [ ] 修改操作有版本控制
