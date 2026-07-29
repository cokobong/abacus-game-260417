import type { MouseEventHandler } from 'react';
import previousArrow from '../assets/ui/navigation/nav_arrow_previous.png';
import nextArrow from '../assets/ui/navigation/nav_arrow_next.png';

export interface NavigationArrowProps {
  direction: 'previous' | 'next';
  ariaLabel: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
}

export function NavigationArrow({
  direction,
  ariaLabel,
  onClick,
  disabled = false,
  className = '',
}: NavigationArrowProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`navigation-arrow inline-flex min-h-11 min-w-11 items-center justify-center border-0 bg-transparent p-0 transition hover:brightness-105 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${className}`}
    >
      <img
        src={direction === 'previous' ? previousArrow : nextArrow}
        alt=""
        className="pointer-events-none block h-full w-full object-contain"
        draggable={false}
      />
    </button>
  );
}
