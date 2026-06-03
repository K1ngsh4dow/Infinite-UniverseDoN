
'use client';

import React from 'react';

const ReactIcon = () => (
    <svg width="16" height="16" viewBox="-10.5 -9.45 21 18.9" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-sky-500">
        <circle cx="0" cy="0" r="2" fill="currentColor"></circle>
        <g stroke="currentColor" strokeWidth="1" fill="none">
            <ellipse rx="10" ry="4.5"></ellipse>
            <ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse>
            <ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse>
        </g>
    </svg>
);

const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
)

export const FileChangesCard = ({ changes }: { changes: { file: string, description: string }[] }) => {
    return (
        <div className="border rounded-lg p-3 bg-card/50 text-sm">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-card-foreground">File changes</h4>
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-2">d0d36f10 <CheckCircle className="h-3 w-3 text-green-500" /> Current</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
                {changes.map((change, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <ReactIcon />
                        <span className="text-muted-foreground">{change.file}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
