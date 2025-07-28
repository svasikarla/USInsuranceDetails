import React from 'react';
import { Badge } from '../ui/DesignSystem';

interface RegulatoryBadgeProps {
  regulatoryLevel: 'federal' | 'state' | 'federal_state';
  federalRegulation?: string;
  stateRegulation?: string;
  stateCode?: string;
  regulatoryContext?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RegulatoryBadge: React.FC<RegulatoryBadgeProps> = ({
  regulatoryLevel,
  federalRegulation,
  stateRegulation,
  stateCode,
  regulatoryContext,
  size = 'sm'
}) => {
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'federal':
        return 'blue';
      case 'state':
        return 'orange';
      case 'federal_state':
        return 'teal';
      default:
        return 'gray';
    }
  };

  const getBadgeText = () => {
    switch (regulatoryLevel) {
      case 'federal':
        return federalRegulation ? `Federal: ${federalRegulation.toUpperCase()}` : 'Federal';
      case 'state':
        return stateCode ? `State: ${stateCode.toUpperCase()}` : 'State';
      case 'federal_state':
        return 'Federal + State';
      default:
        return 'Unknown';
    }
  };

  const getTooltipContent = () => {
    if (regulatoryContext) {
      return regulatoryContext;
    }

    switch (regulatoryLevel) {
      case 'federal':
        if (federalRegulation === 'aca_ehb') {
          return 'Required under ACA Essential Health Benefits';
        } else if (federalRegulation === 'mental_health_parity') {
          return 'Protected under Mental Health Parity Act';
        } else if (federalRegulation === 'erisa') {
          return 'Governed by ERISA regulations';
        }
        return 'Subject to federal regulations';
      case 'state':
        return `State-specific requirement${stateCode ? ` for ${stateCode.toUpperCase()}` : ''}`;
      case 'federal_state':
        return 'Subject to both federal and state oversight';
      default:
        return 'Regulatory classification pending';
    }
  };

  return (
    <div title={getTooltipContent()}>
      <Badge
        variant={getBadgeColor(regulatoryLevel)}
        size={size}
        className="cursor-help"
      >
        {getBadgeText()}
      </Badge>
    </div>
  );
};

export default RegulatoryBadge;
