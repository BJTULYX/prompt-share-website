import { supabase } from './src/utils/supabase';

// 创建数据库表
async function initDatabase() {
  console.log('开始初始化数据库...');

  // 创建prompts表
  const { error: promptsError } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT 'Image2',
        style TEXT NOT NULL DEFAULT '其他',
        cover_image TEXT,
        description TEXT,
        parameters JSONB DEFAULT '{}'::jsonb,
        author_id UUID REFERENCES auth.users(id),
        author_name TEXT NOT NULL DEFAULT '匿名用户',
        like_count INTEGER DEFAULT 0,
        collect_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
      CREATE INDEX IF NOT EXISTS idx_prompts_style ON prompts(style);
      CREATE INDEX IF NOT EXISTS idx_prompts_like_count ON prompts(like_count DESC);
      CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
    `
  });

  if (promptsError) {
    console.error('创建prompts表失败', promptsError);
  } else {
    console.log('prompts表创建成功');
  }

  // 创建likes表
  const { error: likesError } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        prompt_id UUID REFERENCES prompts(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, prompt_id)
      );
    `
  });

  if (likesError) {
    console.error('创建likes表失败', likesError);
  } else {
    console.log('likes表创建成功');
  }

  // 创建collections表
  const { error: collectionsError } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        prompt_id UUID REFERENCES prompts(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, prompt_id)
      );
    `
  });

  if (collectionsError) {
    console.error('创建collections表失败', collectionsError);
  } else {
    console.log('collections表创建成功');
  }

  // 创建comments表
  const { error: commentsError } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prompt_id UUID REFERENCES prompts(id) NOT NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON comments(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    `
  });

  if (commentsError) {
    console.error('创建comments表失败', commentsError);
  } else {
    console.log('comments表创建成功');
  }

  // 插入测试数据
  const testPrompts = [
    {
      "title": "超可爱二次元少女头像prompt",
      "content": "masterpiece, best quality, 1girl, cute, pastel colors, pink hair, twin tails, big eyes, blush, smile, frilled dress, white background, soft lighting, anime style, 8k",
      "model": "Image2",
      "style": "二次元",
      "cover_image": "https://picsum.photos/seed/1/400/300",
      "description": "适合做头像的可爱二次元少女，颜色柔和，细节丰富",
      "parameters": {"CFG": "7", "尺寸": "1024x1024", "步数": "30"},
      "author_name": "AI绘画爱好者",
      "like_count": 126,
      "collect_count": 89,
      "comment_count": 23
    },
    {
      "title": "赛博朋克城市夜景prompt",
      "content": "cyberpunk cityscape at night, neon lights, rain, wet streets, skyscrapers, flying cars, holographic advertisements, dark atmosphere, cinematic lighting, 8k, hyper detailed, blade runner style",
      "model": "Midjourney",
      "style": "科幻",
      "cover_image": "https://picsum.photos/seed/2/400/300",
      "description": "赛博朋克风格的城市夜景，光影效果拉满",
      "parameters": {"尺寸": "1920x1080", "步数": "40", "CFG": "8"},
      "author_name": "科幻设计爱好者",
      "like_count": 234,
      "collect_count": 156,
      "comment_count": 45
    },
    {
      "title": "国风山水插画prompt",
      "content": "traditional chinese ink painting, mountain landscape, river, pine trees, mist, traditional architecture, birds, soft colors, elegant, artistic, high detail, 8k",
      "model": "Stable Diffusion",
      "style": "国风",
      "cover_image": "https://picsum.photos/seed/3/400/300",
      "description": "中国风水墨山水画，意境悠远",
      "parameters": {"尺寸": "1024x1536", "步数": "35", "CFG": "7.5"},
      "author_name": "国风艺术家",
      "like_count": 189,
      "collect_count": 112,
      "comment_count": 32
    }
  ];

  const { error: insertError } = await supabase.from('prompts').insert(testPrompts);
  if (insertError) {
    console.error('插入测试数据失败', insertError);
  } else {
    console.log('测试数据插入成功');
  }

  console.log('数据库初始化完成！');
}

initDatabase().catch(console.error);
