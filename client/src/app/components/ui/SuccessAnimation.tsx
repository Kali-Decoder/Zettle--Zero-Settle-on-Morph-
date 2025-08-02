import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  className?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  message = 'Success!',
  onComplete,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setShowCheck(true);
    }, 200);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2000);

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
          w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-green-500
          flex items-center justify-center
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}>
          {/* Checkmark with animation */}
          <div className={`
            transform transition-all duration-300 ease-out delay-200
            ${showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `}>
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>
        
        {/* Ripple effect */}
        <div className={`
          absolute inset-0 rounded-full border-2 border-green-400
          animate-ping opacity-75
          ${isVisible ? 'scale-100' : 'scale-0'}
        `} />
      </div>
      
      {message && (
        <p className="mt-4 text-lg font-semibold text-green-600 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}; 