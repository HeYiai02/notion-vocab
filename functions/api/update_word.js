export async function onRequestPost(context) {
    const NOTION_SECRET = context.env.NOTION_SECRET;
  
    if (!NOTION_SECRET) {
      return new Response(JSON.stringify({ error: "环境变量 NOTION_SECRET 未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  
    try {
      const body = await context.request.json();
      const { pageId, newLevel, nextReviewDate } = body;
  
      if (!pageId) {
        return new Response(JSON.stringify({ error: "缺少必要的 pageId 参数" }), {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
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
  
      const data = await response.json();
  
      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.message || "更新 Notion 失败" }), {
          status: response.status,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
  
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }