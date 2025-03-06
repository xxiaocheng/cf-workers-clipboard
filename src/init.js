// 初始化静态资源的脚本
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>多端剪切板同步</title>
  <link rel="stylesheet" href="/styles.css">
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
</head>
<body>
  <div id="app"></div>
  <script src="/app.js"></script>
</body>
</html>`;

const css = `* {
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
}`;

const js = `const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

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
    
    // 在组件销毁时停止轮询
    onUnmounted(() => {
      stopPolling();
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
}).mount('#app');`;

// 导出静态资源
module.exports = {
  html,
  css,
  js
}; 