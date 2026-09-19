export async function onRequest(context) {
    const NOTION_SECRET = context.env.NOTION_SECRET;
    const DATABASE_ID = context.env.DATABASE_ID;
  
    if (!NOTION_SECRET || !DATABASE_ID) {
      return new Response(JSON.stringify({ error: "环境变量未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      });
  
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
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