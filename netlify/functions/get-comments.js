const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { chapter } = event.queryStringParameters;
    
    if (!chapter) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '缺少章节参数' })
        };
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/search/issues?q=label:approved+"${encodeURIComponent(chapter)}"+in:body+repo:${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}&sort=created&order=desc`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Novel-Website-Comment-System'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`GitHub API 错误: ${response.status}`);
        }
        
        const data = await response.json();
        const comments = data.items.map(issue => {
            const bodyMatch = issue.body.match(/\*\*(.*?)\*\* 评论于 (.*?):\n\n(.*?)\n\n---/s);
            return {
                author: bodyMatch ? bodyMatch[1] : '匿名读者',
                date: bodyMatch ? bodyMatch[2] : new Date(issue.created_at).toLocaleDateString('zh-CN'),
                content: bodyMatch ? bodyMatch[3] : issue.body.substring(0, 200) + (issue.body.length > 200 ? '...' : '')
            };
        });
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(comments)
        };
    } catch (error) {
        console.error('获取评论错误:', error);
        return {
            statusCode: 200,
            body: JSON.stringify([])
        };
    }
};
