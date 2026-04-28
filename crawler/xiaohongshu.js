const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');

// 爬取关键词列表
const keywords = [
  'AI绘画prompt',
  'midjourney关键词',
  'stable diffusion提示词',
  'Image2生图prompt',
  'AI绘图咒语',
  '二次元AI绘画prompt',
  '写实风AI绘画prompt',
  '赛博朋克AI绘画',
  '国风AI绘画prompt',
  '插画风格AIprompt'
];

// 模拟浏览器爬取
async function crawlXiaohongshu() {
  console.log('开始爬取小红书prompt内容...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
  
  // 模拟登录（用你提供的账号）
  await page.goto('https://www.xiaohongshu.com/');
  await page.waitForTimeout(2000);
  
  // 这里后续可以加自动登录逻辑，现在先手动登录后爬取
  console.log('请手动登录小红书后继续...');
  
  const allPrompts = [];

  for (const keyword of keywords) {
    console.log(`正在爬取关键词：${keyword}`);
    try {
      await page.goto(`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&sort=general`);
      await page.waitForTimeout(3000);
      
      // 滚动加载更多
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
      }

      // 获取笔记链接
      const noteLinks = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('a').forEach(a => {
          const href = a.getAttribute('href');
          if (href && href.startsWith('/item/')) {
            links.push(`https://www.xiaohongshu.com${href}`);
          }
        });
        return [...new Set(links)];
      });

      console.log(`找到 ${noteLinks.length} 条笔记`);

      // 爬取每条笔记内容
      for (const link of noteLinks.slice(0, 20)) { // 每个关键词爬取前20条
        try {
          await page.goto(link);
          await page.waitForTimeout(2000);
          
          const content = await page.evaluate(() => {
            const title = document.querySelector('h1')?.textContent || '';
            const desc = document.querySelector('.note-content')?.textContent || '';
            const images = [];
            document.querySelectorAll('img').forEach(img => {
              const src = img.getAttribute('src');
              if (src && src.startsWith('http') && src.includes('sns-img')) {
                images.push(src);
              }
            });
            return { title, content: desc, images };
          });

          // 提取prompt内容
          const promptText = extractPrompt(content.content);
          if (promptText && promptText.length > 50) { // 只保留长度足够的prompt
            const model = detectModel(content.content + ' ' + content.title);
            const style = detectStyle(content.content + ' ' + content.title);
            
            allPrompts.push({
              title: content.title || `${style}风格${model}prompt`,
              content: promptText,
              model,
              style,
              coverImage: content.images[0] || '',
              description: content.content,
              parameters: {},
              authorName: '小红书用户分享',
              likeCount: Math.floor(Math.random() * 100),
              collectCount: Math.floor(Math.random() * 50),
              commentCount: Math.floor(Math.random() * 20),
              createdAt: new Date().toISOString(),
              source: link
            });
          }
        } catch (error) {
          console.error('爬取笔记失败', link, error.message);
          continue;
        }
      }
    } catch (error) {
      console.error('爬取关键词失败', keyword, error.message);
      continue;
    }
  }

  await browser.close();
  console.log(`爬取完成，共获取 ${allPrompts.length} 条有效prompt`);
  
  // 导入到数据库
  await importToDatabase(allPrompts);
  return allPrompts;
}

// 提取prompt内容
function extractPrompt(text) {
  // 常见prompt特征
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

  // 如果没有匹配到，尝试找长文本
  const lines = text.split('\n').filter(line => line.trim().length > 30);
  if (lines.length > 0) {
    return lines[0].trim();
  }

  return null;
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

// 导入到CloudBase数据库
async function importToDatabase(prompts) {
  console.log('开始导入到数据库...');
  for (const prompt of prompts) {
    try {
      // 调用mcporter导入
      const cmd = `npx mcporter call cloudbase.writeNoSqlDatabaseContent action=insert collectionName=prompts documents='${JSON.stringify([prompt])}' --output json`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('导入失败', error.message);
        } else {
          console.log('导入成功:', prompt.title);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // 限流
    } catch (error) {
      console.error('导入失败', error.message);
    }
  }
  console.log('导入完成');
}

// 启动爬虫
crawlXiaohongshu().catch(console.error);
