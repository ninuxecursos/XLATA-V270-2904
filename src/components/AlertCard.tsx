
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  amount: string;
  description: string;
  urgencyLevel: string;
  urgencyType: 'critical' | 'high' | 'emergency';
  onClick?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  amount,
  description,
  urgencyLevel,
  urgencyType,
  onClick
}) => {
  const getUrgencyColor = () => {
    switch (urgencyType) {
      case 'critical':
        return 'bg-red-900 border-red-700';
      case 'high':
        return 'bg-orange-900 border-orange-700';
      case 'emergency':
        return 'bg-red-950 border-red-800';
      default:
        return 'bg-red-900 border-red-700';
    }
  };

  const getIconBgColor = () => {
    switch (urgencyType) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'emergency':
        return 'bg-red-700';
      default:
        return 'bg-red-600';
    }
  };

  return (
    <Card 
      className={`${getUrgencyColor()} alert-card alert-card-${urgencyType} cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`${getIconBgColor()} p-3 rounded-lg transition-all duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded transition-all duration-300">
                  {title}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg transition-all duration-300">
                {subtitle}
              </h3>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4">
          <span className="bg-red-600 text-white font-bold text-lg px-4 py-2 rounded-full transition-all duration-300">
            {amount}
          </span>
        </div>
        <p className="text-gray-300 text-sm mb-4 transition-all duration-300">
          {description}
        </p>
        <div className="w-full bg-red-800 h-2 rounded-full mb-2">
          <div className="bg-red-500 h-2 rounded-full w-full transition-all duration-300"></div>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-yellow-500 text-xs font-bold flex items-center gap-1 transition-all duration-300">
            ⚠ {urgencyLevel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
