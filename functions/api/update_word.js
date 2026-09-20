export async function onRequestPost(context) {
  const NOTION_SECRET = context.env.NOTION_SECRET;
  const AUTH_PASSWORD = context.env.AUTH_PASSWORD; // 获取设置的密码

  if (!NOTION_SECRET) {
    return new Response(JSON.stringify({ error: "环境变量 NOTION_SECRET 未配置" }), { status: 500 });
  }

  // 👈 密码校验逻辑：如果设置了密码，且前端传来的密码不匹配，拦截更新
  const reqPassword = context.request.headers.get("X-Auth-Password");
  if (AUTH_PASSWORD && reqPassword !== AUTH_PASSWORD) {
    return new Response(JSON.stringify({ error: "游客模式只读，无法修改 Notion 数据库" }), {
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