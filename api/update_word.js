export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('只支持 POST 请求');

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
                    Level: { number: newLevel },
                    NextReview: { date: { start: nextReviewDate } }
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.message);
        
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}