
import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white dark:bg-gray-900 py-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © {currentYear} FraserVotes. All rights reserved.
          </div>
          
          <div className="flex items-center mt-2 md:mt-0 text-sm text-gray-500 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 mx-1 text-red-500 fill-red-500" />
            <span>by Akshat Chopra for John Fraser SAC</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
