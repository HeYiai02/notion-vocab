export async function onRequestPost(context) {
  const NOTION_SECRET = context.env.NOTION_SECRET;
  const AUTH_PASSWORD = context.env.AUTH_PASSWORD;

  if (!NOTION_SECRET) {
    return new Response(JSON.stringify({ error: "环境变量 NOTION_SECRET 未配置" }), { status: 500 });
  }

  // 严格鉴权：未设置密码或密码不匹配均拦截
  const reqPassword = context.request.headers.get("X-Auth-Password");
  if (!AUTH_PASSWORD || reqPassword !== AUTH_PASSWORD) {
    return new Response(JSON.stringify({ error: "未授权：密码错误或服务未配置管理员密码" }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  try {
    const body = await context.request.json();
    const { pageId, newLevel, nextReviewDate } = body;

    if (!pageId) {
      return new Response(JSON.stringify({ error: "缺少必要的 pageId 参数" }), { status: 400 });
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          Level: { number: newLevel },
          NextReview: { date: { start: nextReviewDate } }
        }
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}