export async function onRequestPost(context) {
    const AUTH_PASSWORD = context.env.AUTH_PASSWORD;
  
    if (!AUTH_PASSWORD) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "云端未设置 AUTH_PASSWORD 环境变量！请先在平台后台添加。" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  
    try {
      const body = await context.request.json().catch(() => ({}));
      const reqPassword = body.password || context.request.headers.get("X-Auth-Password");
  
      if (reqPassword === AUTH_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: "密码错误，解锁失败！" }), {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }