import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

const TooltipProvider: React.FC<TooltipProps> = ({ children, content }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
        <div className="bg-black text-white text-xs rounded py-1 px-2">
          {content}
        </div>
      </div>
    </div>
  );
};

export { TooltipProvider };