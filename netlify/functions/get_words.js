exports.handler = async function(event, context) {
    const NOTION_SECRET = process.env.NOTION_SECRET;
    const DATABASE_ID = process.env.DATABASE_ID;
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
                        { property: 'NextReview', date: { on_or_before: today } },
                        { property: 'NextReview', date: { is_empty: true } }
                    ]
                }
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.message);

        const words = data.results.map(page => {
            const props = page.properties;
            return {
                pageId: page.id,
                en: props.Word?.title[0]?.plain_text || "",
                zh: props.Translation?.rich_text[0]?.plain_text || "",
                sub: props.Subtitle?.rich_text[0]?.plain_text || "",
                level: props.Level?.number || 0,
            };
        }).filter(w => w.en);

        return {
            statusCode: 200,
            body: JSON.stringify(words)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};