import React from 'react';
import { getApps, openApp } from '../services/launcherService';

export function LauncherCard({ query }) {
    const apps = getApps();

    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Buy on</p>
            <div className="flex flex-wrap gap-2">
                {apps.map((app) => (
                    <button
                        key={app.name}
                        onClick={() => openApp(app.name, query)}
                        className="flex-1 min-w-[45%] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-sm shadow-sm transition-transform active:scale-95 opacity-90 hover:opacity-100"
                        style={{
                            backgroundColor: app.color,
                            color: app.textColor
                        }}
                    >
                        {app.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
