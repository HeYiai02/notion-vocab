export async function onRequest(context) {
  const NOTION_SECRET = context.env.NOTION_SECRET;
  const DATABASE_ID = context.env.DATABASE_ID;

  if (!NOTION_SECRET || !DATABASE_ID) {
    return new Response(JSON.stringify({ error: "环境变量 NOTION_SECRET 或 DATABASE_ID 未配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  try {
    const url = new URL(context.request.url);
    const isVisitor = url.searchParams.get("mode") === "visitor"; // 👈 区分游客模式
    const today = new Date().toISOString().split('T')[0];

    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const bodyPayload = { page_size: 100 };

      // 如果不是游客模式，按艾宾浩斯复习日期过滤
      if (!isVisitor) {
        bodyPayload.filter = {
          or: [
            { property: "NextReview", date: { on_or_before: today } },
            { property: "NextReview", date: { is_empty: true } }
          ]
        };
      }

      if (startCursor) {
        bodyPayload.start_cursor = startCursor;
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.message || "Notion API 请求失败" }), {
          status: response.status,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }

      allResults.push(...(data.results || []));
      hasMore = data.has_more;
      startCursor = data.next_cursor;
      if (isVisitor && allResults.length >= 100) break; // 游客体验拉取前 100 词打乱即可
    }

    // 解析 Notion 单词
    let words = allResults.map(page => {
      const props = page.properties || {};
      const titleProp = props.Word || props.Name || props.Title || Object.values(props).find(p => p.type === 'title');
      const en = titleProp?.title?.[0]?.plain_text || "";

      const zhProp = props.Chinese || props.Zh || props.Translation || props.释义;
      const zh = zhProp?.rich_text?.[0]?.plain_text || "";

      const phoneticProp = props.Phonetic || props.音标;
      const phonetic = phoneticProp?.rich_text?.[0]?.plain_text || "";

      const subProp = props.Sub || props.Notes || props.例句;
      const sub = subProp?.rich_text?.[0]?.plain_text || "";

      const levelProp = props.Level || props.等级;
      const level = levelProp?.number || 0;

      return { pageId: page.id, en, zh, phonetic, sub, level };
    }).filter(w => w.en);

    // 👈 游客模式下：打乱全量单词顺序（Fisher-Yates Shuffle）
    if (isVisitor) {
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
    }

    return new Response(JSON.stringify(words), {
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