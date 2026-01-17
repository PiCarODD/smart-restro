import { ReactNode, MouseEvent } from 'react';
import { useNavigationStore, PageName, PageParams } from '@/store/navigationStore';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: PageName;
  params?: PageParams;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  [key: string]: any; // Allow other props like disabled, etc.
}

export function NavLink({ 
  to, 
  params, 
  children, 
  className, 
  activeClassName,
  onClick,
  ...props 
}: NavLinkProps) {
  const { currentPage, navigate } = useNavigationStore();
  const isActive = currentPage === to;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (!e.defaultPrevented) {
      navigate(to, params);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </button>
  );
}
