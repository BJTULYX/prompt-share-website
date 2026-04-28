import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../utils/cloudbase';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      setIsLoggedIn(!!user);
    };
    checkAuth();
    auth.onAuthStateChanged(checkAuth);
  }, []);

  const handleLogin = async () => {
    try {
      await auth.signInWithRedirect({
        provider: 'WECHAT'
      });
    } catch (error) {
      console.error('登录失败', error);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          魔法Prompt库
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/search" className="text-gray-600 hover:text-indigo-600 transition">
            搜索
          </Link>
          {isLoggedIn && (
            <Link to="/publish" className="text-gray-600 hover:text-indigo-600 transition">
              发布
            </Link>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="text-gray-600 hover:text-indigo-600 transition">
                个人中心
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition"
              >
                退出
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              微信登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
