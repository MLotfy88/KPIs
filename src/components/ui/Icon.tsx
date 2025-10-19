import React from 'react';
import { icons } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  tier?: Tier;
}

const tierColors: Record<Tier, string> = {
  bronze: 'text-[#CD7F32]', // Bronze color
  silver: 'text-gray-400',   // Silver color
  gold: 'text-yellow-500', // Gold color
  platinum: 'text-blue-300', // Platinum color
};

const Icon: React.FC<IconProps> = ({ name, tier, className, ...props }) => {
  // @ts-ignore
  const LucideIcon = icons[name];

  const colorClass = tier ? tierColors[tier] : '';

  if (!LucideIcon) {
    // @ts-ignore
    const DefaultIcon = icons['CircleHelp'];
    return <DefaultIcon className={twMerge('h-6 w-6', className)} {...props} />;
  }

  return <LucideIcon className={twMerge('h-6 w-6', colorClass, className)} {...props} />;
};

export default Icon;
