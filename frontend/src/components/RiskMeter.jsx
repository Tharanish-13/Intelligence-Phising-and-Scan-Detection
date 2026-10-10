import React from 'react';

export const RiskMeter = ({ score, severity, size = 180 }) => {
  // SVG radius and stroke calculation
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Score is 0-100
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (score >= 60) {
      return {
        stroke: '#f43f5e', // rose-500
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        shadow: 'rgba(244, 63, 94, 0.35)',
        label: 'HIGH RISK'
      };
    }
    if (score >= 30) {
      return {
        stroke: '#f59e0b', // amber-500
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        shadow: 'rgba(245, 158, 11, 0.35)',
        label: 'MEDIUM RISK'
      };
    }
    return {
      stroke: '#10b981', // emerald-500
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      shadow: 'rgba(16, 185, 129, 0.35)',
      label: 'LOW RISK'
    };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 filter drop-shadow-md"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 8px ${color.shadow})`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tight ${color.text}`}>
            {score}
          </span>
          <span className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-0.5">
            / 100 Risk
          </span>
        </div>
      </div>

      {/* Severity pill */}
      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${color.bg} ${color.text} ${color.border}`}>
        {severity || color.label}
      </div>
    </div>
  );
};
