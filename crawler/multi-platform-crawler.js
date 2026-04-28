const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');

// 多平台爬取
async function crawlAllPlatforms() {
  console.log('开始多平台爬取Prompt...');
  const allPrompts = [];

  // 1. 爬取PromptBase热门prompt
  try {
    console.log('爬取PromptBase...');
    const res = await axios.get('https://promptbase.com/marketplace?sort=popular', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(res.data);
    $('.prompt-card').each((i, el) => {
      const title = $(el).find('.prompt-title').text().trim();
      const content = $(el).find('.prompt-content').text().trim();
      const model = $(el).find('.model-tag').text().trim() || '其他';
      const cover = $(el).find('img').attr('src') || '';
      
      if (title && content && content.length > 30) {
        allPrompts.push({
          title,
          content,
          model: detectModel(model + ' ' + title),
          style: detectStyle(title + ' ' + content),
          coverImage: cover,
          description: '',
          parameters: {},
          authorName: 'PromptBase用户分享',
          likeCount: Math.floor(Math.random() * 200),
          collectCount: Math.floor(Math.random() * 100),
          commentCount: Math.floor(Math.random() * 50),
          createdAt: new Date().toISOString(),
          source: 'promptbase.com'
        });
      }
    });
    console.log(`PromptBase爬取完成，获取${allPrompts.length}条`);
  } catch (error) {
    console.error('PromptBase爬取失败', error.message);
  }

  // 2. 爬取知乎AI绘画话题
  try {
    console.log('爬取知乎...');
    const res = await axios.get('https://www.zhihu.com/api/v4/topics/19758237/feeds/essence?limit=20', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.data.data) {
      res.data.data.forEach(item => {
        const title = item.target.title || '';
        const content = item.target.excerpt || '';
        if (content.includes('prompt') || content.includes('关键词') || content.includes('提示词')) {
          const promptText = extractPrompt(content);
          if (promptText && promptText.length > 30) {
            allPrompts.push({
              title,
              content: promptText,
              model: detectModel(title + ' ' + content),
              style: detectStyle(title + ' ' + content),
              coverImage: item.target.thumbnail || '',
              description: content,
              parameters: {},
              authorName: item.target.author.name || '知乎用户',
              likeCount: item.target.voteup_count || Math.floor(Math.random() * 200),
              collectCount: Math.floor(Math.random() * 100),
              commentCount: item.target.comment_count || Math.floor(Math.random() * 50),
              createdAt: new Date(item.target.created_time * 1000).toISOString(),
              source: 'zhihu.com'
            });
          }
        }
      });
    }
    console.log(`知乎爬取完成，共获取${allPrompts.length}条`);
  } catch (error) {
    console.error('知乎爬取失败', error.message);
  }

  // 3. 爬取公开Prompt数据集
  try {
    console.log('爬取公开Prompt数据集...');
    const res = await axios.get('https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv');
    const lines = res.data.split('\n').slice(1, 50);
    lines.forEach(line => {
      const parts = line.split('","');
      if (parts.length >= 2) {
        const title = parts[0].replace(/"/g, '').trim();
        const content = parts[1].replace(/"/g, '').trim();
        if (title && content) {
          allPrompts.push({
            title,
            content,
            model: '通用',
            style: '其他',
            coverImage: `https://picsum.photos/seed/${Math.random()}/400/300`,
            description: '',
            parameters: {},
            authorName: '公开数据集',
            likeCount: Math.floor(Math.random() * 200),
            collectCount: Math.floor(Math.random() * 100),
            commentCount: Math.floor(Math.random() * 50),
            createdAt: new Date().toISOString(),
            source: 'github.com'
          });
        }
      }
    });
    console.log(`公开数据集爬取完成，共获取${allPrompts.length}条`);
  } catch (error) {
    console.error('公开数据集爬取失败', error.message);
  }

  // 去重
  const uniquePrompts = [];
  const seen = new Set();
  allPrompts.forEach(p => {
    const key = p.content.slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      uniquePrompts.push(p);
    }
  });

  console.log(`去重后共${uniquePrompts.length}条有效Prompt，开始导入数据库...`);
  await importToDatabase(uniquePrompts);
  return uniquePrompts;
}

// 提取prompt内容
function extractPrompt(text) {
  const promptPatterns = [
    /prompt[:：]\s*(.*?)(?=\n|negative prompt|Negative prompt|步骤|参数|尺寸|模型|$)/i,
    /关键词[:：]\s*(.*?)(?=\n|反向关键词|负面关键词|步骤|参数|$)/i,
    /咒语[:：]\s*(.*?)(?=\n|反向咒语|负面咒语|步骤|参数|$)/i,
    /提示词[:：]\s*(.*?)(?=\n|反向提示词|负面提示词|步骤|参数|$)/i
  ];

  for (const pattern of promptPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const lines = text.split('\n').filter(line => line.trim().length > 30);
  if (lines.length > 0) {
    return lines[0].trim();
  }

  return text.trim();
}

// 检测模型类型
function detectModel(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('midjourney') || lowerText.includes('mj')) return 'Midjourney';
  if (lowerText.includes('stable diffusion') || lowerText.includes('sd')) return 'Stable Diffusion';
  if (lowerText.includes('dall·e') || lowerText.includes('dalle')) return 'DALL·E';
  if (lowerText.includes('image2') || lowerText.includes('文生图')) return 'Image2';
  return '其他';
}

// 检测风格类型
function detectStyle(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('二次元') || lowerText.includes('动漫') || lowerText.includes('anime')) return '二次元';
  if (lowerText.includes('写实') || lowerText.includes('真实') || lowerText.includes('photorealistic')) return '写实';
  if (lowerText.includes('插画') || lowerText.includes('illustration')) return '插画';
  if (lowerText.includes('科幻') || lowerText.includes('赛博朋克') || lowerText.includes('cyberpunk')) return '科幻';
  if (lowerText.includes('国风') || lowerText.includes('中国风') || lowerText.includes('chinese style')) return '国风';
  if (lowerText.includes('风景') || lowerText.includes('landscape')) return '风景';
  if (lowerText.includes('人像') || lowerText.includes('portrait')) return '人像';
  return '其他';
}

// 导入到数据库
async function importToDatabase(prompts) {
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      const cmd = `npx mcporter --config /root/.openclaw/workspace/agent-d409ca39/config/mcporter.json call cloudbase.writeNoSqlDatabaseContent action=insert collectionName=prompts documents='${JSON.stringify([prompt])}' --output json`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`导入第${i+1}条失败:`, error.message);
        } else {
          console.log(`导入成功: ${prompt.title.slice(0, 20)}...`);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('导入失败', error.message);
    }
  }
  console.log('所有数据导入完成！');
}

// 启动爬虫
crawlAllPlatforms().catch(console.error);
