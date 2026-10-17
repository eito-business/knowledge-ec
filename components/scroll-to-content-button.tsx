'use client';

import { Button } from '@/components/ui/button';

type ScrollToContentButtonProps = {
  targetId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
};

export default function ScrollToContentButton({
  targetId,
  className,
  size = 'lg',
  children,
}: ScrollToContentButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Button size={size} className={className} onClick={handleClick}>
      {children}
    </Button>
  );
}
