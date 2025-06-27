import React from 'react';
import { Space } from 'antd';

interface MedalBadgeProps {
  tier: string;
  icon: string;
  sales?: number;
}

const MedalBadge: React.FC<MedalBadgeProps> = ({ tier, icon, sales }) => {
  const getMedalClass = () => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'medal-bronze';
      case 'silver':
        return 'medal-silver';
      case 'gold':
        return 'medal-gold';
      case 'platinum':
        return 'medal-platinum';
      default:
        return '';
    }
  };

  const medalClass = getMedalClass();

  if (!medalClass) {
    return (
      <Space>
        {sales !== undefined && <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{sales}</span>}
        <span>{tier}</span>
      </Space>
    );
  }

  return (
    <Space align="center">
      {sales !== undefined && (
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#212121' }}>
          {sales}
        </span>
      )}
      <div className={medalClass} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span>{tier}</span>
      </div>
    </Space>
  );
};

export default MedalBadge;