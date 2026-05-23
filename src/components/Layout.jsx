import React from 'react';

export function Layout({ children, header }) {
    return (
        <div className="flex flex-col h-full bg-slate-50 max-w-md mx-auto relative shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between border-b border-gray-50">
                {header}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
                <div className="px-5 py-4 space-y-4">
                    {children}
                </div>
            </main>
        </div>
    );
}
