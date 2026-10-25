import React, { useMemo } from 'react';

interface DisplayScreenProps {
  displayValue: string;
  displayHistory: string;
}

export const DisplayScreen: React.FC<DisplayScreenProps> = ({
  displayValue,
  displayHistory,
}) => {
  // Dynamically calculate font size to prevent wrapping
  const fontSizeRem = useMemo(() => {
    const textLength = displayValue.length;
    if (textLength <= 7) return 3.25;
    return Math.max(1.3, 3.25 - (textLength - 7) * 0.22);
  }, [displayValue]);

  return (
    <div className="mb-4 sm:mb-5 p-4 sm:p-5 rounded-[24px] bg-black/40 border border-white/[0.04] shadow-inner relative overflow-hidden flex flex-col justify-end min-h-[155px] sm:min-h-[170px] select-all">
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />

      {/* Formula/Equation History line */}
      <div className="text-right text-xs text-gray-500/80 font-mono tracking-wide h-5 overflow-hidden truncate whitespace-nowrap mb-1">
        {displayHistory}
      </div>

      {/* Main dynamic value */}
      <div
        className="text-right font-light tracking-tight text-white transition-all duration-150 pr-1 break-all"
        style={{ fontSize: `${fontSizeRem}rem`, lineHeight: 1.1 }}
      >
        {displayValue || '0'}
      </div>
    </div>
  );
};
