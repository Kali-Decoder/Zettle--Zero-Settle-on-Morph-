import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { SuccessAnimation } from './SuccessAnimation';
import { ErrorAnimation } from './ErrorAnimation';

export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';

interface TransactionStatusProps {
  status: TransactionStatus;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onComplete?: () => void;
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  loadingText = 'Processing transaction...',
  successText = 'Transaction successful!',
  errorText = 'Transaction failed',
  onComplete,
  className = ''
}) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [status]);

  if (!showStatus) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
        {status === 'loading' && (
          <LoadingSpinner
            size="lg"
            text={loadingText}
            className="py-8"
          />
        )}
        
        {status === 'success' && (
          <SuccessAnimation
            message={successText}
            onComplete={onComplete}
            className="py-8"
          />
        )}
        
        {status === 'error' && (
          <ErrorAnimation
            message={errorText}
            onComplete={onComplete}
            className="py-8"
          />
        )}
      </div>
    </div>
  );
}; 