export default async function handler(req, res) {
    // 从 Vercel 的环境变量（云端保险箱）中读取两把钥匙
    const NOTION_SECRET = process.env.NOTION_SECRET;
    const DATABASE_ID = process.env.DATABASE_ID;

    // 获取当天的日期 (格式: YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    or: [
                        { property: 'NextReview', date: { on_or_before: today } }, // 到期该复习的
                        { property: 'NextReview', date: { is_empty: true } }       // 刚录入还没复习过的生词
                    ]
                }
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.message);

        // 将 Notion 的复杂数据格式简化为我们需要的前端格式
        const words = data.results.map(page => {
            const props = page.properties;
            return {
                pageId: page.id, // 每行数据的唯一ID，更新时需要用到
                en: props.Word?.title[0]?.plain_text || "",
                zh: props.Translation?.rich_text[0]?.plain_text || "",
                sub: props.Subtitle?.rich_text[0]?.plain_text || "",
                level: props.Level?.number || 0,
            };
        }).filter(w => w.en); // 过滤掉空行

        res.status(200).json(words);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}