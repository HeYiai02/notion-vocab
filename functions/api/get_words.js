export async function onRequest(context) {
    // 从 Cloudflare 的环境变量中读取密钥
    const NOTION_SECRET = context.env.NOTION_SECRET;
    const DATABASE_ID = context.env.DATABASE_ID;
  
    // 获取前端传来的参数
    const request = context.request;
    const url = new URL(request.url);
    const isVisitor = url.searchParams.get('mode') === 'visitor';
  
    const today = new Date().toISOString().split('T')[0];
  
    let queryBody = {};
  
    if (isVisitor) {
        // 🌟 游客模式：随机切片获取全库单词，限定一页 (100个)
        const sortStrategies = [
            { property: 'Word', direction: 'ascending' },       
            { property: 'Word', direction: 'descending' },      
            { timestamp: 'created_time', direction: 'ascending' },  
            { timestamp: 'created_time', direction: 'descending' }, 
            { timestamp: 'last_edited_time', direction: 'ascending' }, 
            { timestamp: 'last_edited_time', direction: 'descending' } 
        ];
        const randomSort = sortStrategies[Math.floor(Math.random() * sortStrategies.length)];
  
        queryBody = {
            page_size: 100,
            sorts: [randomSort] 
        };
    } else {
        // 🌟 主人同步模式：获取今天及之前需要复习的所有词
        queryBody = {
            page_size: 100,
            filter: {
                or: [
                    { property: 'NextReview', date: { on_or_before: today } }, 
                    { property: 'NextReview', date: { is_empty: true } }       
                ]
            }
        };
    }
  
    try {
        let allResults = [];
        let hasMore = true;
        let nextCursor = undefined;
  
        // Notion API 分页循环抓取（突破 100 条限制）
        while (hasMore) {
            if (nextCursor) {
                queryBody.start_cursor = nextCursor;
            }
  
            const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_SECRET}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(queryBody)
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.message);
  
            allResults = allResults.concat(data.results);
            
            // 仅在同步模式下自动翻页抓取全部，游客模式只取第一页
            if (!isVisitor && data.has_more) {
                hasMore = true;
                nextCursor = data.next_cursor;
            } else {
                hasMore = false;
            }
        }
  
        const words = allResults.map(page => {
            const props = page.properties;
            return {
                pageId: page.id,
                en: props.Word?.title[0]?.plain_text || "",
                zh: props.Translation?.rich_text[0]?.plain_text || "",
                sub: props.Subtitle?.rich_text[0]?.plain_text || "",
                phonetic: props.Phonetic?.rich_text[0]?.plain_text || "",
                level: props.Level?.number || 0,
            };
        }).filter(w => w.en);
  
        return new Response(JSON.stringify(words), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
  }