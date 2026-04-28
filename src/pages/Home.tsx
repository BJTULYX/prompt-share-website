import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

interface Prompt {
  id: string;
  title: string;
  content: string;
  model: string;
  style: string;
  coverImage: string;
  description: string;
  parameters: Record<string, any>;
  authorName: string;
  authorId?: string;
  authorAvatar?: string;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  createdAt: string;
}

const Home = () => {
  const [hotPrompts, setHotPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotPrompts();
  }, []);

  const fetchHotPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('like_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // 字段映射
      const mappedData = data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        model: item.model,
        style: item.style,
        coverImage: item.cover_image,
        description: item.description,
        parameters: item.parameters,
        authorName: item.author_name,
        likeCount: item.like_count,
        collectCount: item.collect_count,
        commentCount: item.comment_count,
        createdAt: item.created_at
      }));
      
      setHotPrompts(mappedData);
    } catch (error) {
      console.error('加载数据失败', error);
      // 降级加载静态数据
      const res = await fetch('/prompts.json');
      const data = await res.json();
      setHotPrompts(data);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: '二次元', count: 123 },
    { name: '写实', count: 98 },
    { name: '插画', count: 76 },
    { name: '科幻', count: 54 },
    { name: '动漫', count: 89 },
    { name: '风景', count: 67 },
  ];

  const models = [
    { name: 'Image2', count: 156 },
    { name: 'Midjourney', count: 234 },
    { name: 'DALL·E', count: 87 },
    { name: 'Stable Diffusion', count: 198 },
  ];

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  return (
    <div className="space-y-12">
      {/* 搜索区域 */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-800">
          找到最适合你的AI绘画魔法Prompt
        </h1>
        <p className="text-gray-600 text-lg">
          数十万用户分享的高质量生图提示词，一键复制直接使用
        </p>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="搜索prompt，比如：二次元少女、赛博朋克..."
            className="w-full px-6 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value)}`;
              }
            }}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition">
            搜索
          </button>
        </div>
      </div>

      {/* 分类区域 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">风格分类</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/search?style=${encodeURIComponent(category.name)}`}
                className="flex justify-between items-center text-gray-600 hover:text-indigo-600 transition"
              >
                <span>{category.name}</span>
                <span className="text-sm text-gray-400">{category.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">模型分类</h3>
          <div className="space-y-2">
            {models.map((model) => (
              <Link
                key={model.name}
                to={`/search?model=${encodeURIComponent(model.name)}`}
                className="flex justify-between items-center text-gray-600 hover:text-indigo-600 transition"
              >
                <span>{model.name}</span>
                <span className="text-sm text-gray-400">{model.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl shadow-sm col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-indigo-800">💡 使用小贴士</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• 不用登录即可浏览、搜索、复制所有prompt</li>
            <li>• 登录后可以发布自己的prompt、点赞、收藏、评论</li>
            <li>• 复制后直接粘贴到Image2/Midjourney即可生成同款图片</li>
            <li>• 分享优质prompt可以获得更多曝光和点赞</li>
          </ul>
        </div>
      </div>

      {/* 热门prompt列表 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🔥 热门Prompt</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotPrompts.map((prompt) => (
            <Link
              key={prompt.id}
              to={`/prompt/${prompt.id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="h-48 bg-gray-100 overflow-hidden">
                {prompt.coverImage ? (
                  <img
                    src={prompt.coverImage}
                    alt={prompt.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    暂无样图
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-1">
                  {prompt.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3 h-10">
                  {prompt.content}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    {prompt.model}
                  </span>
                  <div className="flex gap-3">
                    <span>👍 {prompt.likeCount || 0}</span>
                    <span>⭐ {prompt.collectCount || 0}</span>
                    <span>💬 {prompt.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {hotPrompts.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              暂无数据，正在爬取小红书优质prompt中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
