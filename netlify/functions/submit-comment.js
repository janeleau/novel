const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        const { author, content, chapterTitle, chapterIdentifier } = JSON.parse(event.body);
        
        // 验证输入
        if (!content || content.length < 5) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '评论内容太短' })
            };
        }
        
        // 垃圾评论过滤
        const blockedWords = ['垃圾', '废物', '傻逼', 'fuck', 'shit', 'http://', 'https://', '[url]', '[link]'];
        const hasBlockedContent = blockedWords.some(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
        
        if (hasBlockedContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '评论包含不当内容' })
            };
        }
        
        // 使用环境变量中的 token
        const response = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    title: `评论: ${chapterTitle.substring(0, 50)}${chapterTitle.length > 50 ? '...' : ''}`,
                    body: `**${author}** 评论于 ${new Date().toLocaleString('zh-CN')}:\n\n${content}\n\n---\n*章节: ${chapterTitle}*\n*标识符: ${chapterIdentifier}*`,
                    labels: ['website-comment', 'pending-review']
                })
            }
        );
        
        if (response.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: '评论提交成功，等待审核' })
            };
        } else {
            const errorData = await response.text();
            console.error('GitHub API Error:', errorData);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: '提交失败，请稍后重试' })
            };
        }
    } catch (error) {
        console.error('Server Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '服务器错误' })
        };
    }
};
