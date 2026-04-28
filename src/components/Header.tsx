import { Link } from 'react-router-dom';

const Header = () => {

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
          <a 
            href="https://github.com/BJTULYX/prompt-share-website" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-indigo-600 transition"
          >
            开源地址
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
