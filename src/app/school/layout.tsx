import React from 'react';

export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {children}
        </div>
    );
}
