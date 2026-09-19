exports.handler = async function(event, context) {
    // 获取网页传过来的单词
    const word = event.queryStringParameters.word;
    if (!word) return { statusCode: 400, body: 'Missing word' };

    try {
        // 让无视跨域限制的后台，去请求有道词典的官方 JSON 接口
        const response = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`);
        const data = await response.json();

        let usphone = "";
        let ukphone = "";

        // 提取有道返回的美式音标 (usphone) 和 英式音标 (ukphone)
        if (data.ec && data.ec.word && data.ec.word[0]) {
            usphone = data.ec.word[0].usphone || "";
            ukphone = data.ec.word[0].ukphone || "";
        } else if (data.simple && data.simple.word && data.simple.word[0]) {
            usphone = data.simple.word[0].usphone || "";
            ukphone = data.simple.word[0].ukphone || "";
        }

        // 把音标返回给我们的前端网页
        return {
            statusCode: 200,
            body: JSON.stringify({ usphone, ukphone })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};