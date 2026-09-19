const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// 托管当前目录下的静态网页文件 (如 index.html)
app.use(express.static(__dirname));

// 1. 获取待复习单词接口
app.get('/api/get_words', async (req, res) => {
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
        if (data.object === 'error') {
            return res.status(500).json({ error: `Notion 拒绝请求: ${data.message}` });
        }

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

        res.json(words);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. 更新单词状态接口
app.post('/api/update_word', async (req, res) => {
    const NOTION_SECRET = process.env.NOTION_SECRET;
    const { pageId, newLevel, nextReviewDate } = req.body;

    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${NOTION_SECRET}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    'Level': { number: newLevel },
                    'NextReview': { date: { start: nextReviewDate } }
                }
            })
        });

        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});