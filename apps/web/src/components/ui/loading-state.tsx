'use client';

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import type { LoadingState } from '@/types';

interface LoadingStateProps {
  state: LoadingState;
  loadingText?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function LoadingStateWrapper({
  state,
  loadingText = 'Loading...',
  errorMessage = 'Something went wrong',
  onRetry,
  children,
  className,
}: LoadingStateProps) {
  if (state === 'loading') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Simple loading spinner
export function LoadingSpinner({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />;
}

// Full page loading
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
  );
}

// Inline loading for buttons etc
export function InlineLoading({ text }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span>{text}</span>}
    </span>
  );
}

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
