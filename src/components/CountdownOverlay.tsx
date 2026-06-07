'use client';

import React from 'react';

interface CountdownOverlayProps {
    count: number | null;
    total?: number; // Total duration for progress calc
}

export function CountdownOverlay({ count, total = 3 }: CountdownOverlayProps) {
    if (count === null || count <= 0) return null;

    // Radius and Circumference
    const radius = 120; // Slightly smaller to fit in 300x300
    const circumference = 2 * Math.PI * radius;
    const progress = (count / total); // 1.0 down to 0.0
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30" style={{ width: '100%', height: '100%' }}>
            <div className="relative flex items-center justify-center">

                {/* Static Background Circle */}
                <div className="w-[300px] h-[300px] bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                    {/* Number */}
                    <span key={count} className="text-[10rem] leading-none font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-in zoom-in duration-300 font-sans">
                        {count}
                    </span>
                </div>

                {/* Progress SVG */}
                <svg className="absolute top-0 left-0 w-[300px] h-[300px] -rotate-90 overflow-visible">
                    {/* Track */}
                    <circle
                        cx="150"
                        cy="150"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                    />
                    {/* Progress Indicator */}
                    <circle
                        cx="150"
                        cy="150"
                        r={radius}
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>

                {/* Animated Outer Ring */}
                <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping" />
            </div>
        </div>
    );
}
