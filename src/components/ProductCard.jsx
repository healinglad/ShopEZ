import React from 'react';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function ProductCard({ item, comparison, isLoading }) {
    if (isLoading) {
        return (
            <div className="mt-3 flex gap-3">
                <div className="h-20 flex-1 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-20 flex-1 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!comparison) return null;

    const { flipkart, bigbasket, bestPrice } = comparison;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 grid grid-cols-2 gap-3"
        >
            <StoreCard
                name="Flipkart"
                data={flipkart}
                isBest={bestPrice === 'flipkart'}
                color="blue"
            />
            <StoreCard
                name="BigBasket"
                data={bigbasket}
                isBest={bestPrice === 'bigbasket'}
                color="green"
            />
        </motion.div>
    );
}

function StoreCard({ name, data, isBest, color }) {
    const colorClasses = {
        blue: isBest ? "bg-blue-600 text-white" : "bg-white border-blue-100 text-gray-800",
        green: isBest ? "bg-green-600 text-white" : "bg-white border-green-100 text-gray-800"
    };

    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "relative p-3 rounded-2xl border transition-all active:scale-95 flex flex-col justify-between h-24 shadow-sm",
                colorClasses[color],
                !isBest && "border"
            )}
        >
            <div className="flex justify-between items-start">
                <span className={cn("text-xs font-bold uppercase tracking-wider opacity-80", isBest ? "text-white" : "text-gray-500")}>
                    {name}
                </span>
                {isBest && <div className="bg-white/20 p-1 rounded-full"><CheckCircle className="w-3 h-3 text-white" /></div>}
            </div>

            <div className="mt-1">
                {data.available ? (
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-light opacity-80">₹</span>
                        <span className="text-xl font-bold tracking-tight">{data.price}</span>
                    </div>
                ) : (
                    <span className="text-xs font-medium opacity-60 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Unavailable
                    </span>
                )}
            </div>

            {/* Decorator */}
            {!isBest && (
                <div className="absolute bottom-2 right-2 opacity-10">
                    <ExternalLink className="w-6 h-6" />
                </div>
            )}
        </a>
    )
}
