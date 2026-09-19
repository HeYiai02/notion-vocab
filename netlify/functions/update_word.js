exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: '只支持 POST 请求' };

    const NOTION_SECRET = process.env.NOTION_SECRET;
    const body = JSON.parse(event.body);
    const { pageId, newLevel, nextReviewDate } = body; 

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
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};