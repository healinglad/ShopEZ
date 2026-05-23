import React from 'react';
import { ExternalLink, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';

export function PriceComparisonCard({ item, comparison, isLoading }) {
    if (isLoading) {
        return (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!comparison) return null;

    const { flipkart, bigbasket, bestPrice } = comparison;

    return (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {/* Flipkart Card */}
            <a
                href={flipkart.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "p-3 rounded-lg border flex flex-col justify-between transition-colors hover:bg-opacity-50",
                    bestPrice === 'flipkart' ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-700">Flipkart</span>
                    {bestPrice === 'flipkart' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                    {flipkart.available ? (
                        <span className="text-lg font-bold text-gray-900">₹{flipkart.price}</span>
                    ) : (
                        <span className="text-red-500 text-xs font-medium flex items-center">
                            <XCircle className="w-3 h-3 mr-1" /> Unavailable
                        </span>
                    )}
                </div>
                <div className="mt-2 text-xs text-blue-600 flex items-center">
                    Open App <ExternalLink className="w-3 h-3 ml-1" />
                </div>
            </a>

            {/* BigBasket Card */}
            <a
                href={bigbasket.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "p-3 rounded-lg border flex flex-col justify-between transition-colors hover:bg-opacity-50",
                    bestPrice === 'bigbasket' ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-700">BigBasket</span>
                    {bestPrice === 'bigbasket' && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <div>
                    {bigbasket.available ? (
                        <span className="text-lg font-bold text-gray-900">₹{bigbasket.price}</span>
                    ) : (
                        <span className="text-red-500 text-xs font-medium flex items-center">
                            <XCircle className="w-3 h-3 mr-1" /> Unavailable
                        </span>
                    )}
                </div>
                <div className="mt-2 text-xs text-green-600 flex items-center">
                    Open App <ExternalLink className="w-3 h-3 ml-1" />
                </div>
            </a>
        </div>
    );
}
