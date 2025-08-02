'use client';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, isHoverable = true, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-gray-100',
        isHoverable && 'hover:shadow-lg transition-shadow',
        className
      )}
    >
      {children}
    </div>
  );
}; 