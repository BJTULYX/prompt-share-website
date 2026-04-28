import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../utils/cloudbase';

interface Prompt {
  _id: string;
  title: string;
  content: string;
  model: string;
  style: string;
  coverImage: string;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  createdAt: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('published'); // published, collected
  const [publishedPrompts, setPublishedPrompts] = useState<Prompt[]>([]);
  const [collectedPrompts, setCollectedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('请先登录');
      navigate('/');
      return;
    }
    setUser(currentUser);
    fetchPublishedPrompts(currentUser.uid!);
    fetchCollectedPrompts(currentUser.uid!);
  }, [navigate]);

  const fetchPublishedPrompts = async (userId: string) => {
    try {
      const res = await db.collection('prompts')
        .where({ authorId: userId })
        .orderBy('createdAt', 'desc')
        .get();
      setPublishedPrompts(res.data as Prompt[]);
    } catch (error) {
      console.error('获取发布的prompt失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectedPrompts = async (userId: string) => {
    try {
      // 先查收藏表
      const collectRes = await db.collection('collections')
        .where({ userId: userId })
        .orderBy('createdAt', 'desc')
        .get();
      
      const collectRecords = collectRes.data as any[];
      if (collectRecords.length === 0) {
        setCollectedPrompts([]);
        return;
      }

      // 根据收藏的promptId查prompt详情
      const promptIds = collectRecords.map(item => item.promptId);
      const promptRes = await db.collection('prompts')
        .where({ _id: db.command.in(promptIds) })
        .get();
      
      setCollectedPrompts(promptRes.data as Prompt[]);
    } catch (error) {
      console.error('获取收藏的prompt失败', error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('确定要删除这个Prompt吗？')) return;
    try {
      await db.collection('prompts').doc(id).remove();
      setPublishedPrompts(publishedPrompts.filter(item => item._id !== id));
      alert('删除成功');
    } catch (error) {
      console.error('删除失败', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  if (!user) {
    return <div className="text-center py-20">请先登录</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                {user.displayName?.charAt(0) || '用'}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {user.displayName || '匿名用户'}
            </h1>
            <p className="text-gray-500">
              已发布 {publishedPrompts.length} 个Prompt · 收藏 {collectedPrompts.length} 个Prompt
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'published'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            我发布的
          </button>
          <button
            onClick={() => setActiveTab('collected')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'collected'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            我收藏的
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'published' && (
            <div className="space-y-4">
              {publishedPrompts.map((prompt) => (
                <div key={prompt._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    {prompt.coverImage && (
                      <img
                        src={prompt.coverImage}
                        alt={prompt.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <Link
                        to={`/prompt/${prompt._id}`}
                        className="font-medium text-gray-800 hover:text-indigo-600"
                      >
                        {prompt.title}
                      </Link>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>👍 {prompt.likeCount || 0}</span>
                        <span>⭐ {prompt.collectCount || 0}</span>
                        <span>💬 {prompt.commentCount || 0}</span>
                        <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePrompt(prompt._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))}

              {publishedPrompts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  你还没有发布过Prompt，<Link to="/publish" className="text-indigo-600">去发布第一个</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collected' && (
            <div className="space-y-4">
              {collectedPrompts.map((prompt) => (
                <div key={prompt._id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  {prompt.coverImage && (
                    <img
                      src={prompt.coverImage}
                      alt={prompt.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/prompt/${prompt._id}`}
                      className="font-medium text-gray-800 hover:text-indigo-600"
                    >
                      {prompt.title}
                    </Link>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>👍 {prompt.likeCount || 0}</span>
                      <span>⭐ {prompt.collectCount || 0}</span>
                      <span>💬 {prompt.commentCount || 0}</span>
                      <span>作者：{prompt.authorName || '匿名'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {collectedPrompts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  你还没有收藏过Prompt
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
