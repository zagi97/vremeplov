import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card className={`border-dashed dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        {Icon && (
          <div className="mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-700">
            <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            {description}
          </p>
        )}

        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
