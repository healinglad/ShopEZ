import React from 'react';
import { getApps, openApp } from '../services/launcherService';
import { Check, Trash2, ShoppingBag } from 'lucide-react';

export function ShoppingList({ items, onToggleItem, onDeleteItem }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center pt-32 text-zinc-600">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                <p>Empty List</p>
            </div>
        );
    }

    // Active items first
    const sorted = [...items].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));

    return (
        <div className="p-3 space-y-2 pb-24">
            {sorted.map((item) => (
                <div
                    key={item.id}
                    className={`
                    w-full flex flex-col rounded-lg border transition-all
                    ${item.checked
                            ? 'bg-zinc-900/50 border-zinc-800/50'
                            : 'bg-zinc-800 border-zinc-700 shadow-lg shadow-black/20'
                        }
                `}
                >
                    {/* Main Row */}
                    <div className="flex items-center p-3 gap-3">

                        {/* Checkbox */}
                        <button
                            onClick={() => onToggleItem(item.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.checked ? 'bg-zinc-700 border-zinc-700' : 'border-gray-500 hover:border-red-500'}`}
                        >
                            {item.checked && <Check className="w-4 h-4 text-gray-400" />}
                        </button>

                        {/* Text */}
                        <span
                            onClick={() => onToggleItem(item.id)}
                            className={`flex-1 text-[16px] font-medium leading-snug cursor-pointer ${item.checked ? 'text-zinc-600 line-through' : 'text-gray-100'}`}
                        >
                            {item.text}
                        </span>

                        {/* Delete */}
                        <button onClick={() => onDeleteItem(item.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Actions (Launchers) - Only for active items */}
                    {!item.checked && (
                        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
                            {getApps().map(app => (
                                <button
                                    key={app.name}
                                    onClick={(e) => { e.stopPropagation(); openApp(app.name, item.text); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-700 border border-zinc-600 hover:bg-zinc-600 text-xs font-bold text-gray-200 transition-colors whitespace-nowrap"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: app.color }} />
                                    {app.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
