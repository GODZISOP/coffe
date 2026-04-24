import React from 'react';

export const ActionButton = ({ onClick, label, color }: any) => {
  return (
    <button
      onClick={(e) => {
        console.log('ActionButton Clicked');
        onClick(e);
      }}
      className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-[#1a1716] ${color} hover:opacity-90 transition-opacity cursor-pointer`}
    >
      {label}
    </button>
  );
};
