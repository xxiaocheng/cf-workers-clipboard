// 手动初始化静态资源的脚本
const { html, css, js } = require('./init');

// 添加一个路由用于手动初始化静态资源
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/manual-init' && url.searchParams.get('key') === 'initialize-static-resources') {
    event.respondWith(handleManualInit(event.request));
  } else {
    event.respondWith(new Response('Not found', { status: 404 }));
  }
});

async function handleManualInit(request) {
  try {
    // 存储静态资源
    await CLIPBOARD_DATA.put('static/index.html', html);
    await CLIPBOARD_DATA.put('static/styles.css', css);
    await CLIPBOARD_DATA.put('static/app.js', js);
    
    // 标记为已初始化
    await CLIPBOARD_DATA.put('static_initialized', 'true');
    
    return new Response(JSON.stringify({
      success: true,
      message: '静态资源已成功初始化'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '初始化静态资源失败',
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
} 