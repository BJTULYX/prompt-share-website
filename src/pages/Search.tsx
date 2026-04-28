import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const style = searchParams.get('style') || '';
  const model = searchParams.get('model') || '';
  
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(q);
  const [sortBy, setSortBy] = useState('hot'); // hot, latest, most_liked

  useEffect(() => {
    fetchPrompts();
  }, [q, style, model, sortBy]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('prompts').select('*');
      
      if (q) {
        const keyword = `%${q}%`;
        query = query.or(`title.ilike.${keyword},content.ilike.${keyword},style.ilike.${keyword},model.ilike.${keyword}`);
      }
      
      if (style) {
        query = query.eq('style', style);
      }
      
      if (model) {
        query = query.eq('model', model);
      }
      
      if (sortBy === 'hot' || sortBy === 'most_liked') {
        query = query.order('like_count', { ascending: false });
      } else if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      
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
      
      setFilteredPrompts(mappedData);
    } catch (error) {
      console.error('加载数据失败', error);
      // 降级加载静态数据
      const res = await fetch('/prompts.json');
      const data = await res.json();
      setFilteredPrompts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchText)}`;
  };

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索prompt，比如：二次元少女、赛博朋克..."
            className="w-full px-6 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition"
          >
            搜索
          </button>
        </form>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-gray-600">
          找到 <span className="font-semibold text-indigo-600">{filteredPrompts.length}</span> 条结果
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="hot">最热</option>
            <option value="latest">最新</option>
            <option value="most_liked">最多点赞</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt) => (
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

        {filteredPrompts.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            暂无搜索结果，试试其他关键词吧
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
