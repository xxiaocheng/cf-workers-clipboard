import { Router } from 'itty-router';
import CryptoJS from 'crypto-js';

// 创建路由器
const router = Router();

// 静态资源
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>多端剪切板同步</title>
  <style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #f5f5f5;
    color: #333;
    line-height: 1.6;
  }
  
  #app {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .container {
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: calc(100vh - 40px);
  }
  
  .header {
    padding: 20px;
    background-color: #4a6cf7;
    color: white;
    text-align: center;
  }
  
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    flex-grow: 1;
  }
  
  .login-form {
    width: 100%;
    max-width: 400px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  
  .password-strength {
    margin-top: 8px;
    font-size: 14px;
  }
  
  .password-strength.weak {
    color: #e74c3c;
  }
  
  .password-strength.medium {
    color: #f39c12;
  }
  
  .password-strength.strong {
    color: #27ae60;
  }
  
  .btn {
    display: inline-block;
    padding: 12px 24px;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .btn:hover {
    background-color: #3a5ce5;
  }
  
  .btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #e74c3c;
    margin-top: 20px;
  }
  
  .clipboard-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .clipboard-header {
    padding: 15px 20px;
    background-color: #4a6cf7;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .clipboard-header h1 {
    font-size: 20px;
    margin: 0;
  }
  
  .clipboard-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .clipboard-item {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .clipboard-item-content {
    word-break: break-word;
    white-space: pre-wrap;
  }
  
  .clipboard-item-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    color: #666;
    font-size: 12px;
  }
  
  .clipboard-input {
    padding: 20px;
    border-top: 1px solid #eee;
    background-color: #fff;
  }
  
  .clipboard-form {
    display: flex;
    gap: 10px;
  }
  
  .clipboard-form textarea {
    flex-grow: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    resize: none;
    height: 80px;
    font-family: inherit;
  }
  
  .clipboard-form button {
    align-self: flex-end;
  }
  
  .loading-indicator {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }
  
  .empty-state p {
    margin-bottom: 20px;
  }
  
  @media (max-width: 600px) {
    .container {
      border-radius: 0;
      height: 100vh;
      max-height: 100vh;
    }
    
    #app {
      padding: 0;
    }
    
    .clipboard-header h1 {
      font-size: 18px;
    }
    
    .clipboard-form {
      flex-direction: column;
    }
    
    .clipboard-form button {
      align-self: stretch;
    }
  }
  </style>
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
  const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

  createApp({
    setup() {
      // 状态
      const isLoggedIn = ref(false);
      const password = ref('');
      const groupId = ref('');
      const clipboardItems = ref([]);
      const newContent = ref('');
      const isLoading = ref(false);
      const error = ref('');
      const pagination = reactive({
        page: 1,
        totalPages: 1,
        isLoadingMore: false
      });
  
      // 计算属性
      const passwordStrength = computed(() => {
        if (!password.value) return { text: '', class: '' };
        
        const hasLetters = /[a-zA-Z]/.test(password.value);
        const hasNumbers = /[0-9]/.test(password.value);
        const isLongEnough = password.value.length >= 13;
        
        if (hasLetters && hasNumbers && isLongEnough) {
          return { text: '强', class: 'strong' };
        } else if (password.value.length >= 8) {
          return { text: '中等', class: 'medium' };
        } else {
          return { text: '弱', class: 'weak' };
        }
      });
      
      const isPasswordValid = computed(() => {
        const hasLetters = /[a-zA-Z]/.test(password.value);
        const hasNumbers = /[0-9]/.test(password.value);
        const isLongEnough = password.value.length >= 13;
        
        return hasLetters && hasNumbers && isLongEnough;
      });
  
      // 方法
      const login = async () => {
        if (!isPasswordValid.value) {
          error.value = '密码必须至少13位，且包含字母和数字';
          return;
        }
        
        try {
          isLoading.value = true;
          error.value = '';
          
          const response = await fetch('/api/validate-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password.value })
          });
          
          const data = await response.json();
          
          if (data.success) {
            groupId.value = data.groupId;
            localStorage.setItem('groupId', data.groupId);
            localStorage.setItem('password', password.value);
            isLoggedIn.value = true;
            
            // 加载剪贴板内容
            loadClipboardItems();
            
            // 设置轮询
            startPolling();
          } else {
            error.value = data.message;
          }
        } catch (err) {
          error.value = '发生错误，请重试';
          console.error(err);
        } finally {
          isLoading.value = false;
        }
      };
      
      const logout = () => {
        isLoggedIn.value = false;
        groupId.value = '';
        clipboardItems.value = [];
        localStorage.removeItem('groupId');
        localStorage.removeItem('password');
        stopPolling();
      };
      
      const loadClipboardItems = async (page = 1) => {
        if (!groupId.value) return;
        
        try {
          if (page === 1) {
            isLoading.value = true;
          } else {
            pagination.isLoadingMore = true;
          }
          
          const response = await fetch(\`/api/clipboard/\${groupId.value}?page=\${page}\`);
          const data = await response.json();
          
          if (data.success) {
            if (page === 1) {
              clipboardItems.value = data.items;
            } else {
              clipboardItems.value = [...clipboardItems.value, ...data.items];
            }
            
            pagination.page = data.pagination.page;
            pagination.totalPages = data.pagination.totalPages;
          }
        } catch (err) {
          console.error('加载剪贴板内容失败', err);
        } finally {
          isLoading.value = false;
          pagination.isLoadingMore = false;
        }
      };
      
      const loadMoreItems = () => {
        if (pagination.page < pagination.totalPages && !pagination.isLoadingMore) {
          loadClipboardItems(pagination.page + 1);
        }
      };
      
      const addClipboardItem = async () => {
        if (!newContent.value.trim() || !groupId.value) return;
        
        try {
          const response = await fetch(\`/api/clipboard/\${groupId.value}\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent.value })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // 将新项添加到列表顶部
            clipboardItems.value.unshift(data.item);
            newContent.value = '';
          }
        } catch (err) {
          console.error('添加剪贴板内容失败', err);
        }
      };
      
      // 轮询
      let pollingInterval = null;
      
      const startPolling = () => {
        // 每5秒检查一次新内容
        pollingInterval = setInterval(() => {
          loadClipboardItems();
        }, 5000);
      };
      
      const stopPolling = () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      };
      
      // 格式化日期
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
      };
      
      // 监听滚动加载更多
      const handleScroll = (event) => {
        const element = event.target;
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
          loadMoreItems();
        }
      };
      
      // 生命周期钩子
      onMounted(() => {
        // 检查本地存储中是否有保存的凭据
        const savedGroupId = localStorage.getItem('groupId');
        const savedPassword = localStorage.getItem('password');
        
        if (savedGroupId && savedPassword) {
          groupId.value = savedGroupId;
          password.value = savedPassword;
          isLoggedIn.value = true;
          
          // 加载剪贴板内容
          loadClipboardItems();
          
          // 设置轮询
          startPolling();
        }
      });
      
      return {
        isLoggedIn,
        password,
        groupId,
        clipboardItems,
        newContent,
        isLoading,
        error,
        pagination,
        passwordStrength,
        isPasswordValid,
        login,
        logout,
        loadMoreItems,
        addClipboardItem,
        formatDate,
        handleScroll
      };
    },
    template: \`
      <div class="container">
        <template v-if="!isLoggedIn">
          <div class="header">
            <h1>多端剪切板同步</h1>
          </div>
          <div class="login-container">
            <div class="login-form">
              <div class="form-group">
                <label for="password">请输入密码</label>
                <input 
                  type="password" 
                  id="password" 
                  v-model="password" 
                  placeholder="至少13位，包含字母和数字"
                  autocomplete="current-password"
                >
                <div v-if="password" class="password-strength" :class="passwordStrength.class">
                  密码强度: {{ passwordStrength.text }}
                </div>
              </div>
              <button 
                class="btn" 
                @click="login" 
                :disabled="isLoading || !isPasswordValid"
              >
                {{ isLoading ? '正在处理...' : '进入同步组' }}
              </button>
              <div v-if="error" class="error-message">
                {{ error }}
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="clipboard-container">
            <div class="clipboard-header">
              <h1>多端剪切板同步</h1>
              <button class="btn" @click="logout">退出</button>
            </div>
            
            <div class="clipboard-content" @scroll="handleScroll">
              <div v-if="isLoading && clipboardItems.length === 0" class="loading-indicator">
                加载中...
              </div>
              
              <div v-else-if="clipboardItems.length === 0" class="empty-state">
                <p>还没有内容，开始添加吧！</p>
              </div>
              
              <template v-else>
                <div 
                  v-for="item in clipboardItems" 
                  :key="item.id" 
                  class="clipboard-item"
                >
                  <div class="clipboard-item-content">{{ item.content }}</div>
                  <div class="clipboard-item-meta">
                    <span>{{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
                
                <div v-if="pagination.isLoadingMore" class="loading-indicator">
                  加载更多...
                </div>
              </template>
            </div>
            
            <div class="clipboard-input">
              <form class="clipboard-form" @submit.prevent="addClipboardItem">
                <textarea 
                  v-model="newContent" 
                  placeholder="输入要同步的内容..."
                  required
                ></textarea>
                <button type="submit" class="btn">发送</button>
              </form>
            </div>
          </div>
        </template>
      </div>
    \`
  }).mount('#app');
  </script>
</body>
</html>`;

// 验证密码强度
function validatePassword(password) {
  // 至少13位，包含字母和数字
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const isLongEnough = password.length >= 13;
  
  return hasLetters && hasNumbers && isLongEnough;
}

// 生成组ID
function generateGroupId(password) {
  return CryptoJS.SHA256(password).toString();
}

// 处理请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 首页
  if (path === '/' || path === '') {
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // API路由：验证密码
  if (path === '/api/validate-password' && request.method === 'POST') {
    try {
      const data = await request.json();
      const { password } = data;
      
      if (!password) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '请提供密码' 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      if (!validatePassword(password)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '密码必须至少13位，且包含字母和数字' 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      const groupId = generateGroupId(password);
      const groupExists = await CLIPBOARD_DATA.get(`group:${groupId}`) !== null;
      
      return new Response(JSON.stringify({ 
        success: true, 
        groupId,
        isNewGroup: !groupExists
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '处理请求时发生错误',
        error: error.message
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  // API路由：获取剪贴板内容
  if (path.startsWith('/api/clipboard/') && request.method === 'GET') {
    try {
      const groupId = path.split('/')[3];
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = 20;
      
      // 获取组信息
      const groupInfo = await CLIPBOARD_DATA.get(`group:${groupId}`, 'json');
      
      if (!groupInfo) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '组不存在' 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 404
        });
      }
      
      // 获取剪贴板内容列表
      const clipboardList = await CLIPBOARD_DATA.get(`clipboard:${groupId}:list`, 'json') || [];
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedIds = clipboardList.slice(startIndex, endIndex);
      
      // 获取每个剪贴板内容的详细信息
      const clipboardItems = [];
      for (const id of paginatedIds) {
        const item = await CLIPBOARD_DATA.get(`clipboard:${groupId}:item:${id}`, 'json');
        if (item) {
          clipboardItems.push(item);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        items: clipboardItems,
        pagination: {
          page,
          pageSize,
          totalItems: clipboardList.length,
          totalPages: Math.ceil(clipboardList.length / pageSize)
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '处理请求时发生错误',
        error: error.message
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  // API路由：添加剪贴板内容
  if (path.startsWith('/api/clipboard/') && request.method === 'POST') {
    try {
      const groupId = path.split('/')[3];
      const data = await request.json();
      const { content } = data;
      
      if (!content) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '内容不能为空' 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      // 获取组信息
      let groupInfo = await CLIPBOARD_DATA.get(`group:${groupId}`, 'json');
      
      // 如果组不存在，创建新组
      if (!groupInfo) {
        groupInfo = {
          id: groupId,
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        };
        await CLIPBOARD_DATA.put(`group:${groupId}`, JSON.stringify(groupInfo));
      } else {
        // 更新组的最后更新时间
        groupInfo.lastUpdatedAt = new Date().toISOString();
        await CLIPBOARD_DATA.put(`group:${groupId}`, JSON.stringify(groupInfo));
      }
      
      // 获取剪贴板内容列表
      const clipboardList = await CLIPBOARD_DATA.get(`clipboard:${groupId}:list`, 'json') || [];
      
      // 创建新的剪贴板内容
      const timestamp = Date.now();
      const id = `${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
      const clipboardItem = {
        id,
        content,
        type: 'text',
        createdAt: new Date().toISOString()
      };
      
      // 将新内容添加到列表中
      clipboardList.unshift(id);
      await CLIPBOARD_DATA.put(`clipboard:${groupId}:list`, JSON.stringify(clipboardList));
      await CLIPBOARD_DATA.put(`clipboard:${groupId}:item:${id}`, JSON.stringify(clipboardItem));
      
      return new Response(JSON.stringify({ 
        success: true, 
        item: clipboardItem
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '处理请求时发生错误',
        error: error.message
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  // 调试路由
  if (path === '/debug') {
    const keys = await CLIPBOARD_DATA.list();
    
    return new Response(JSON.stringify({
      keys: keys.keys.map(k => k.name)
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 404
  return new Response('Not Found', { status: 404 });
} 