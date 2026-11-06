import React from 'react';

export default function ParticipantAvatar({ participant, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-base',
  };
  const initials = (participant?.name || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white shadow-sm ${className}`}
      style={{ backgroundColor: participant?.color || '#64748b' }}
      title={participant?.name}
    >
      {initials}
    </div>
  );
}