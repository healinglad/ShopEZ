import React from 'react';
import { Home, List, History, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function BottomNav({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'home', icon: Home, label: 'Shop' },
        { id: 'lists', icon: List, label: 'Lists' },
        // Future expansion: { id: 'history', icon: History, label: 'History' },
        // { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe pt-2 px-6 shadow-up z-40">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center w-16 h-full space-y-1"
                        >
                            <div className={cn(
                                "p-2 rounded-2xl transition-all duration-300",
                                isActive ? "bg-brand-100 text-brand-600" : "text-gray-400 hover:text-gray-600"
                            )}>
                                <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-brand-700" : "text-gray-400"
                            )}>
                                {tab.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute -bottom-0 w-12 h-1 bg-brand-600 rounded-t-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
