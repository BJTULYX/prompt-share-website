import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  likeCount: number;
  collectCount: number;
  commentCount: number;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

const PromptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPromptDetail();
      checkLikeAndCollectStatus(id);
    }
  }, [id]);

  const fetchPromptDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const mapped = {
        id: data.id,
        title: data.title,
        content: data.content,
        model: data.model,
        style: data.style,
        coverImage: data.cover_image,
        description: data.description,
        parameters: data.parameters,
        authorName: data.author_name,
        likeCount: data.like_count,
        collectCount: data.collect_count,
        commentCount: data.comment_count,
        createdAt: data.created_at
      };
      
      setPrompt(mapped);
    } catch (error) {
      console.error('获取prompt详情失败', error);
      // 降级加载静态数据
      const res = await fetch('/prompts.json');
      const data = await res.json();
      const found = data.find((item: any) => item.id === id);
      if (found) {
        setPrompt(found);
      } else {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkLikeAndCollectStatus = (promptId: string) => {
    const liked = localStorage.getItem(`liked_${promptId}`) === 'true';
    const collected = localStorage.getItem(`collected_${promptId}`) === 'true';
    setIsLiked(liked);
    setIsCollected(collected);
  };

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt.content);
    alert('Prompt已复制到剪贴板');
  };

  const handleLike = async () => {
    if (!prompt) return;

    if (isLiked) {
      // 取消点赞
      localStorage.removeItem(`liked_${prompt.id}`);
      setIsLiked(false);
      setPrompt({ ...prompt, likeCount: (prompt.likeCount || 0) - 1 });
    } else {
      // 点赞
      localStorage.setItem(`liked_${prompt.id}`, 'true');
      setIsLiked(true);
      setPrompt({ ...prompt, likeCount: (prompt.likeCount || 0) + 1 });
    }
  };

  const handleCollect = async () => {
    if (!prompt) return;

    if (isCollected) {
      // 取消收藏
      localStorage.removeItem(`collected_${prompt.id}`);
      setIsCollected(false);
      setPrompt({ ...prompt, collectCount: (prompt.collectCount || 0) - 1 });
    } else {
      // 收藏
      localStorage.setItem(`collected_${prompt.id}`, 'true');
      setIsCollected(true);
      setPrompt({ ...prompt, collectCount: (prompt.collectCount || 0) + 1 });
    }
  };

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  if (!prompt) {
    return <div className="text-center py-20">Prompt不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{prompt.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span>作者：{prompt.authorName || '匿名'}</span>
              <span>模型：{prompt.model}</span>
              <span>风格：{prompt.style}</span>
              <span>发布时间：{new Date(prompt.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {prompt.coverImage && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={prompt.coverImage}
              alt={prompt.title}
              className="w-full max-h-96 object-contain bg-gray-50"
            />
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg relative">
          <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
            {prompt.content}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition"
          >
            复制Prompt
          </button>
        </div>

        {prompt.description && (
          <div className="text-gray-600">
            <h3 className="font-semibold mb-2">描述说明</h3>
            <p>{prompt.description}</p>
          </div>
        )}

        {prompt.parameters && Object.keys(prompt.parameters).length > 0 && (
          <div className="text-gray-600">
            <h3 className="font-semibold mb-2">生成参数</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(prompt.parameters).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500">{key}：</span>
                  <span className="text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              isLiked
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            👍 {prompt.likeCount || 0}
          </button>
          <button
            onClick={handleCollect}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              isCollected
                ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⭐ {prompt.collectCount || 0}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600">
            💬 {prompt.commentCount || 0}
          </div>
          <button
            onClick={handleCopy}
            className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            复制Prompt
          </button>
        </div>
      </div>

      {/* 评论区简化，纯静态展示 */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">评论区 ({prompt.commentCount || 0})</h2>
        <div className="text-center py-8 text-gray-500">
          评论功能正在开发中，敬请期待
        </div>
      </div>
    </div>
  );
};

export default PromptDetail;
