import React from 'react';
import {
  ShieldCheckIcon,
  DollarSignIcon,
  XCircleIcon,
  FileTextIcon,
  UsersIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react';

interface CategoryIconProps {
  category: 'coverage_access' | 'cost_financial' | 'medical_necessity_exclusions' | 'process_administrative' | 'special_populations';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  size?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  riskLevel,
  size = 16,
  className = ''
}) => {
  const getIcon = () => {
    switch (category) {
      case 'coverage_access':
        return <ShieldCheckIcon size={size} className={className} />;
      case 'cost_financial':
        return <DollarSignIcon size={size} className={className} />;
      case 'medical_necessity_exclusions':
        return <XCircleIcon size={size} className={className} />;
      case 'process_administrative':
        return <FileTextIcon size={size} className={className} />;
      case 'special_populations':
        return <UsersIcon size={size} className={className} />;
      default:
        return <InfoIcon size={size} className={className} />;
    }
  };

  const getRiskIcon = () => {
    if (!riskLevel) return null;
    
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return <AlertTriangleIcon size={size} className={`${className} text-red-500`} />;
      case 'medium':
        return <AlertCircleIcon size={size} className={`${className} text-orange-500`} />;
      case 'low':
        return <InfoIcon size={size} className={`${className} text-yellow-500`} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {getIcon()}
      {getRiskIcon()}
    </div>
  );
};

export default CategoryIcon;
