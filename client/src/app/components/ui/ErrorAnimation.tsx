import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ErrorAnimationProps {
  message?: string;
  onComplete?: () => void;
  className?: string;
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({
  message = 'Something went wrong',
  onComplete,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showX, setShowX] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setShowX(true);
    }, 200);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Background circle with animation */}
        <div className={`
          w-16 h-16 rounded-full bg-gradient-to-r from-red-400 to-red-500
          flex items-center justify-center
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}>
          {/* X mark with animation */}
          <div className={`
            transform transition-all duration-300 ease-out delay-200
            ${showX ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `}>
            <X className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>
        
        {/* Ripple effect */}
        <div className={`
          absolute inset-0 rounded-full border-2 border-red-400
          animate-ping opacity-75
          ${isVisible ? 'scale-100' : 'scale-0'}
        `} />
      </div>
      
      {message && (
        <p className="mt-4 text-lg font-semibold text-red-600 animate-fade-in text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
}; 