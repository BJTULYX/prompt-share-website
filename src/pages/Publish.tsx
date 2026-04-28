import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/cloudbase';
import app from '../utils/cloudbase';

const Publish = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    model: 'Image2',
    style: '二次元',
    description: '',
    parameters: {} as Record<string, any>,
    coverImage: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      alert('请先登录后再发布');
      navigate('/');
      return;
    }
    setIsLoggedIn(true);
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await app.uploadFile({
        cloudPath: `covers/${Date.now()}-${file.name}`,
        filePath: file
      });
      const fileUrl = await app.getTempFileURL({
        fileList: [res.fileID]
      });
      setFormData({
        ...formData,
        coverImage: fileUrl.fileList[0].tempFileURL
      });
      alert('图片上传成功');
    } catch (error) {
      console.error('图片上传失败', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('标题和Prompt内容不能为空');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      await db.collection('prompts').add({
        ...formData,
        authorId: user?.uid,
        authorName: (user as any)?.displayName || '匿名用户',
        authorAvatar: (user as any)?.photoURL || '',
        likeCount: 0,
        collectCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString()
      });
      alert('发布成功');
      navigate('/');
    } catch (error) {
      console.error('发布失败', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [key]: value
      }
    });
  };

  if (!isLoggedIn) {
    return <div className="text-center py-20">请先登录</div>;
  }

  const models = ['Image2', 'Midjourney', 'DALL·E', 'Stable Diffusion', '其他'];
  const styles = ['二次元', '写实', '插画', '科幻', '动漫', '风景', '人像', '抽象', '其他'];
  const parameterKeys = ['尺寸', '步数', 'CFG', '采样器', '种子', '模型版本', '其他参数'];

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">发布Prompt</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">标题 *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入prompt标题，比如：超可爱二次元少女"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">封面样图</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {formData.coverImage ? (
              <div className="relative">
                <img
                  src={formData.coverImage}
                  alt="封面"
                  className="max-h-64 mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  删除
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <span className="text-4xl mb-2">📸</span>
                  <span className="text-gray-600 mb-1">点击上传生成样图</span>
                  <span className="text-gray-400 text-sm">支持JPG/PNG格式，建议1024*1024</span>
                </label>
              </div>
            )}
            {uploadingImage && <div className="mt-2 text-gray-500">上传中...</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">生成模型 *</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">风格分类 *</label>
            <select
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {styles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Prompt内容 *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="请输入完整的prompt内容，直接复制你生成图片时使用的prompt即可"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">描述说明</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="选填，描述这个prompt的使用场景、效果特点、注意事项等"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">生成参数（选填）</label>
          <div className="grid grid-cols-2 gap-3">
            {parameterKeys.map((key) => (
              <div key={key} className="flex gap-2">
                <span className="w-20 py-2 text-gray-600 text-sm">{key}：</span>
                <input
                  type="text"
                  value={formData.parameters[key] || ''}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? '发布中...' : '发布Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Publish;
