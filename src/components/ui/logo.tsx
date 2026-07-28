import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer subtle rounded square frame */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="22"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeOpacity="0.9"
      />
      {/* Minimal clean 'T' mark */}
      <path
        d="M 32 38 H 68 M 50 38 V 68"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent dot */}
      <circle cx="50" cy="25" r="3.5" fill="currentColor" />
    </svg>
  );
}
