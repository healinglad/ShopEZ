import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Check, Plus, ChevronDown, ChevronUp, Trash2, Share2, Sparkles, TrendingDown, Info } from 'lucide-react';
import { useVoiceInput } from './hooks/useVoiceInput';
import { parseCommand } from './lib/smartParser';
import { getApps, openApp } from './services/launcherService';
import { fetchPrices } from './services/priceService';

// --- STYLES (PURE JS DARK THEME) ---
const S = {
    app: {
        backgroundColor: '#0A0A0C', color: '#E8EAED',
        height: '100vh', width: '100vw',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
        overflow: 'hidden', position: 'absolute', top: 0, left: 0
    },
    // HEADER
    header: {
        paddingTop: 'calc(env(safe-area-inset-top, 24px) + 16px)',
        paddingLeft: '24px', paddingRight: '24px', paddingBottom: '16px',
        backgroundColor: '#0A0A0C', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #16161A'
    },
    titleBox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    title: { fontSize: '24px', fontWeight: '800', color: '#E8EAED', letterSpacing: '-0.5px' },
    subTitle: { fontSize: '13px', color: '#888', fontWeight: '500', marginTop: '2px' },
    locationBadge: {
        fontSize: '11px', color: '#8AB4F8', backgroundColor: 'rgba(138,180,248,0.08)',
        padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        border: '1px solid rgba(138,180,248,0.15)', marginTop: '6px',
        fontWeight: '700', width: 'fit-content'
    },
    iconBtn: { 
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
        color: '#E8EAED', padding: '10px', cursor: 'pointer', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
    },

    // MAIN
    main: { flex: 1, overflowY: 'auto', paddingBottom: '160px' },

    // ROW
    itemRow: {
        padding: '16px 24px', borderBottom: '1px solid #16161A',
        display: 'flex', flexDirection: 'column', gap: '10px'
    },
    itemMain: { display: 'flex', alignItems: 'center', gap: '14px' },
    checkbox: {
        width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #5F6368',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        cursor: 'pointer', transition: 'all 0.2s'
    },
    checkboxChecked: { borderColor: '#8AB4F8', backgroundColor: 'rgba(138,180,248,0.2)' },
    itemText: { fontSize: '16px', color: '#E8EAED', flex: 1, fontWeight: '500' },
    itemTextChecked: { color: '#5F6368', textDecoration: 'line-through' },

    // PRICE INLINE
    priceInput: {
        background: 'transparent', border: 'none', borderBottom: '1px solid #444',
        outline: 'none', color: '#10B981', fontSize: '14px', width: '70px', textAlign: 'right',
        fontWeight: '700'
    },

    // CHIPS
    chipRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '36px' },
    chip: {
        backgroundColor: '#161618', borderRadius: '8px', padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px', fontWeight: '700', color: '#9AA0A6', border: '1px solid #2C2C2E',
        cursor: 'pointer', transition: 'all 0.2s'
    },
    chipCheapest: {
        backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#10B981', color: '#10B981'
    },

    // SHIMMER ROW
    shimmerRow: {
        display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '36px',
        color: '#8AB4F8', fontStyle: 'italic', fontSize: '12px'
    },
    shimmerDot: {
        width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8AB4F8'
    },

    // BUDGET
    priceBadge: {
        fontSize: '13px', backgroundColor: '#10B981', color: '#fff',
        padding: '3px 8px', borderRadius: '6px', marginLeft: 'auto', cursor: 'pointer',
        fontWeight: '700', letterSpacing: '-0.3px'
    },

    // BOTTOM
    bottomContainer: {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0F0F12', borderTop: '1px solid #1E1E24',
        display: 'flex', flexDirection: 'column', zIndex: 10
    },
    totalBar: {
        padding: '10px 24px', fontSize: '13px', color: '#10B981', fontWeight: '700',
        backgroundColor: 'rgba(16,185,129,0.04)', display: 'flex', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(16,185,129,0.08)'
    },
    inputBar: {
        padding: '14px 24px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        display: 'flex', gap: '12px', alignItems: 'center'
    },
    inputWrap: {
        flex: 1, backgroundColor: '#1C1C21', borderRadius: '14px',
        display: 'flex', alignItems: 'center', padding: '0 16px', height: '50px',
        border: '1px solid #2C2C35'
    },
    input: { background: 'transparent', border: 'none', outline: 'none', color: '#fff', flex: 1, fontSize: '16px' },

    // MENU
    menuOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50 },
    menuSheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#121216', borderRadius: '28px 28px 0 0', padding: '28px',
        borderTop: '1px solid #2C2C35', boxShadow: '0 -8px 40px rgba(0,0,0,0.8)'
    },

    // VOICE BANNER
    voiceBanner: {
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 24px) + 70px)',
        left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#10B981', color: '#fff',
        padding: '10px 22px', borderRadius: '24px',
        fontSize: '14px', fontWeight: '700', zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', gap: '8px'
    },

    // NEW LIST FORM
    newListInput: {
        width: '100%', background: '#1C1C21', border: '1px solid #2C2C35',
        borderRadius: '12px', padding: '12px 16px', color: '#fff',
        fontSize: '16px', outline: 'none', marginTop: '12px', boxSizing: 'border-box'
    },

    // OPTIMIZER PANEL
    optimizerCard: {
        margin: '12px 20px', padding: '14px 18px', borderRadius: '16px',
        backgroundColor: '#121215', border: '1px solid #222228',
        display: 'flex', flexDirection: 'column', gap: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
    },
    optimizerHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer'
    },
    optimizerTitleBox: { display: 'flex', alignItems: 'center', gap: '8px' },
    optimizerTitle: { fontSize: '13px', fontWeight: '800', color: '#E8EAED', letterSpacing: '0.8px' },
    optimizerBadge: {
        fontSize: '11px', backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981',
        padding: '3px 10px', borderRadius: '12px', fontWeight: '800', border: '1px solid rgba(16,185,129,0.2)'
    },
    optimizerBody: {
        display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px',
        borderTop: '1px solid #1E1E24', paddingTop: '10px'
    },
    optimizerRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', color: '#9AA0A6'
    },
    optimizerBarContainer: {
        flex: 1, height: '6px', backgroundColor: '#1E1E24', borderRadius: '3px',
        margin: '0 12px', overflow: 'hidden', position: 'relative'
    },
    optimizerBar: {
        height: '100%', borderRadius: '3px', transition: 'width 0.4s ease'
    }
};

// Stable ID generator
let _idCounter = 0;
function genId() {
    _idCounter += 1;
    return `${Date.now()}-${_idCounter}`;
}

function App() {
    const [lists, setLists] = useState(() => {
        try {
            const s = localStorage.getItem('shopez_lists');
            const p = s ? JSON.parse(s) : [{ id: '1', name: 'Shopping List', items: [] }];
            return p.map(l => ({ ...l, items: (l.items || []).map(i => ({ price: 0, prices: null, loadingPrices: false, ...i })) }));
        } catch {
            return [{ id: '1', name: 'Shopping List', items: [] }];
        }
    });

    const [activeId, setActiveId] = useState(() => {
        const saved = localStorage.getItem('active_id');
        return saved || '1';
    });

    const [location, setLocation] = useState(() => {
        try {
            const saved = localStorage.getItem('shopez_location');
            return saved ? JSON.parse(saved) : { label: '📍 Bangalore', seed: 'Bangalore' };
        } catch {
            return { label: '📍 Bangalore', seed: 'Bangalore' };
        }
    });

    const [showMenu, setShowMenu] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [showNewListForm, setShowNewListForm] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [priceInputVal, setPriceInputVal] = useState('');
    const [showOptimizer, setShowOptimizer] = useState(true);

    const inputRef = useRef(null);
    const { isListening, transcript, startListening, resetTranscript } = useVoiceInput();

    useEffect(() => { localStorage.setItem('shopez_lists', JSON.stringify(lists)); }, [lists]);
    useEffect(() => { localStorage.setItem('active_id', activeId); }, [activeId]);
    useEffect(() => { localStorage.setItem('shopez_location', JSON.stringify(location)); }, [location]);

    // --- HTML5 GEOLOCATION & REVERSE GEOCODING ---
    useEffect(() => {
        // Only trigger geolocation lookup if the location hasn't been manually set before
        const isDefault = location.seed === 'Bangalore' && location.label === '📍 Bangalore';
        if (isDefault && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                // Live geocoding via OpenStreetMap Nominatim API
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
                    .then(res => res.json())
                    .then(data => {
                        const addr = data.address;
                        const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.sublocality || '';
                        const city = addr.city || addr.town || addr.state_district || 'India';
                        const postcode = addr.postcode || '';
                        const label = `📍 ${neighborhood ? `${neighborhood}, ` : ''}${city}${postcode ? ` (${postcode})` : ''}`;
                        setLocation({ label, seed: postcode || city });
                    })
                    .catch(() => {
                        // Keep fallback Bangalore
                    });
            }, () => {
                // Permission denied / GPS disabled - Keep fallback Bangalore
            });
        }
    }, []);

    // Ensure activeId always points to an existing list
    const activeList = lists.find(l => l.id === activeId) || lists[0];

    const updateList = useCallback((fn) => {
        setLists(p => p.map(l => l.id === activeId ? { ...l, items: fn(l.items) } : l));
    }, [activeId]);

    // --- GEOGRAPHIC LOCATION UPDATER ---
    const handleLocationUpdate = (newLabel, newSeed) => {
        setLocation({ label: newLabel, seed: newSeed });
        // Clear all item price matrices to trigger a complete fresh background recalculation based on the new location seed!
        setLists(prev => prev.map(l => ({
            ...l,
            items: l.items.map(i => ({ ...i, prices: null, price: 0 }))
        })));
    };

    // --- AUTOMATED LOCATION-AWARE PRICE DISCOVERY EFFECT ---
    useEffect(() => {
        // Find the first unchecked item in any list that does not have prices and is not loading
        let itemToFetch = null;
        let targetListId = null;

        for (const list of lists) {
            const found = list.items.find(i => !i.prices && !i.loadingPrices && !i.checked);
            if (found) {
                itemToFetch = found;
                targetListId = list.id;
                break;
            }
        }

        if (!itemToFetch || !targetListId) return;

        // Mark item as loading
        setLists(prev => prev.map(l => {
            if (l.id !== targetListId) return l;
            return {
                ...l,
                items: l.items.map(i => i.id === itemToFetch.id ? { ...i, loadingPrices: true } : i)
            };
        }));

        // Execute background search using the active location seed
        fetchPrices(itemToFetch.text, location.seed).then(data => {
            setLists(prev => prev.map(l => {
                if (l.id !== targetListId) return l;
                return {
                    ...l,
                    items: l.items.map(i => i.id === itemToFetch.id ? {
                        ...i,
                        loadingPrices: false,
                        prices: data.prices,
                        price: data.cheapestPrice, // Apply cheapest price to budget
                        cheapestPlatform: data.cheapestPlatform,
                        cheapestPrice: data.cheapestPrice
                    } : i)
                };
            }));
        });
    }, [lists, location.seed]);

    // --- ACTIONS ---
    const addItem = useCallback((inputs) => {
        const arr = (Array.isArray(inputs) ? inputs : [inputs])
            .map(t => (typeof t === 'string' ? t.trim() : ''))
            .filter(t => t.length > 0);
        if (arr.length === 0) return;
        updateList(prev => [
            ...arr.map(t => ({ id: genId(), text: t, checked: false, price: 0, prices: null, loadingPrices: false })),
            ...prev
        ]);
    }, [updateList]);

    const createList = useCallback((name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;
        const l = { id: genId(), name: trimmed, items: [] };
        setLists(p => [...p, l]);
        setActiveId(l.id);
    }, []);

    const handleCommand = useCallback((text) => {
        if (typeof text !== 'string') return;
        const cmd = parseCommand(text);
        if (cmd.type === 'CREATE_LIST') {
            createList(cmd.name || 'New List');
        } else if (cmd.type === 'ADD_ITEMS') {
            addItem(cmd.items);
        }
    }, [addItem, createList]);

    // Voice transcript processing - stable ref to avoid stale closure
    const handleCommandRef = useRef(handleCommand);
    useEffect(() => { handleCommandRef.current = handleCommand; }, [handleCommand]);

    useEffect(() => {
        if (!transcript) return;
        const t = setTimeout(() => {
            handleCommandRef.current(transcript);
            resetTranscript();
        }, 1500);
        return () => clearTimeout(t);
    }, [transcript, resetTranscript]);

    // --- FEATURES ---

    // Budget logger - inline price editing
    const startEditPrice = (id, currentPrice) => {
        setEditingPriceId(id);
        setPriceInputVal(currentPrice > 0 ? String(currentPrice) : '');
    };

    const commitPrice = (id) => {
        const parsed = parseFloat(priceInputVal);
        updateList(items => items.map(i =>
            i.id === id ? { ...i, price: isNaN(parsed) ? 0 : parsed } : i
        ));
        setEditingPriceId(null);
        setPriceInputVal('');
    };

    const totalPrice = activeList.items.reduce((s, i) => s + (i.price || 0), 0);
    const uncheckedCount = activeList.items.filter(i => !i.checked).length;

    // WhatsApp Share
    const shareList = () => {
        const text = `*${activeList.name}*\n\n` +
            activeList.items.map(i => `• ${i.text}${i.price ? ` (₹${i.price})` : ''}`).join('\n');
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Input submit handler
    const handleInputSubmit = (e) => {
        if (e.key === 'Enter' && inputRef.current) {
            const val = inputRef.current.value.trim();
            if (val) {
                addItem(val);
                inputRef.current.value = '';
            }
        }
    };

    // --- CART OPTIMIZER CALCULATIONS ---
    const platformTotals = { blinkit: 0, zepto: 0, instamart: 0, bigbasket: 0, flipkart: 0 };
    let itemsWithPricesCount = 0;

    activeList.items.forEach(item => {
        if (!item.checked && item.prices) {
            itemsWithPricesCount++;
            Object.keys(platformTotals).forEach(platform => {
                platformTotals[platform] += item.prices[platform] || 0;
            });
        }
    });

    const sortedTotals = Object.entries(platformTotals)
        .filter(([_, total]) => total > 0)
        .sort((a, b) => a[1] - b[1]);

    const cheapestPlatformInfo = sortedTotals.length > 0 ? sortedTotals[0] : null;
    const mostExpensivePlatformInfo = sortedTotals.length > 0 ? sortedTotals[sortedTotals.length - 1] : null;
    const potentialSavings = (cheapestPlatformInfo && mostExpensivePlatformInfo) 
        ? (mostExpensivePlatformInfo[1] - cheapestPlatformInfo[1]) 
        : 0;

    return (
        <div style={S.app}>

            {/* VOICE BANNER */}
            {isListening && (
                <div style={S.voiceBanner}>
                    <Mic size={18} />
                    <span>{transcript ? `"${transcript}"` : 'Listening...'}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={S.header}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={S.titleBox} onClick={() => setShowMenu(true)}>
                        <span style={S.title}>{activeList.name}</span>
                        <ChevronDown size={20} color="#8AB4F8" style={{ marginTop: '2px' }} />
                    </div>
                    {/* Live Geolocated Location Badge */}
                    <div 
                        style={S.locationBadge}
                        onClick={() => {
                            const newPin = prompt("Enter your Pincode or City name for location-based pricing:", location.seed);
                            if (newPin && newPin.trim()) {
                                const clean = newPin.trim();
                                handleLocationUpdate(`📍 ${clean}`, clean);
                            }
                        }}
                        title="Tap to change location"
                    >
                        {location.label}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#5F6368', textAlign: 'right', marginRight: '4px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: '#888' }}>{uncheckedCount} of {activeList.items.length} items</span>
                        {totalPrice > 0 && <span style={{ color: '#10B981', fontWeight: '800', marginTop: '2px' }}>₹{totalPrice}</span>}
                    </div>
                    <button style={S.iconBtn} onClick={shareList} title="Share via WhatsApp">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div style={S.main}>
                {activeList.items.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: 120, color: '#5F6368', padding: '0 40px' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#E8EAED', marginBottom: 8 }}>Your list is empty</div>
                        <div style={{ fontSize: 13, color: '#80868B', lineHeight: '1.5' }}>
                            Type items below or tap the microphone to quickly speak and add them (e.g., "buy milk, apples, and eggs").
                        </div>
                    </div>
                )}

                {activeList.items.map(item => (
                    <div key={item.id} style={S.itemRow}>
                        <div style={S.itemMain}>
                            <div
                                onClick={() => {
                                    updateList(items => items.map(i =>
                                        i.id === item.id ? { ...i, checked: !i.checked } : i
                                    ));
                                }}
                                style={item.checked ? { ...S.checkbox, ...S.checkboxChecked } : S.checkbox}
                            >
                                {item.checked && <Check size={14} color="#8AB4F8" />}
                            </div>

                            <span style={item.checked ? { ...S.itemText, ...S.itemTextChecked } : S.itemText}>
                                {item.text}
                            </span>

                            {/* Inline price editor */}
                            {editingPriceId === item.id ? (
                                <input
                                    autoFocus
                                    style={S.priceInput}
                                    value={priceInputVal}
                                    onChange={e => setPriceInputVal(e.target.value)}
                                    onBlur={() => commitPrice(item.id)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') commitPrice(item.id);
                                        if (e.key === 'Escape') setEditingPriceId(null);
                                    }}
                                />
                            ) : (
                                <span
                                    style={item.price > 0 ? S.priceBadge : { ...S.priceBadge, backgroundColor: '#1C1C21', color: '#888' }}
                                    onClick={() => startEditPrice(item.id, item.price)}
                                    title="Tap to set price"
                                >
                                    {item.price > 0 ? `₹${item.price}` : '₹'}
                                </span>
                            )}

                            <button
                                style={{ background: 'transparent', border: 'none', color: '#5F6368', cursor: 'pointer', padding: '4px' }}
                                onClick={() => updateList(p => p.filter(i => i.id !== item.id))}
                                title="Remove item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Integration Chips & Shimmer — only for unchecked items */}
                        {!item.checked && (
                            <>
                                {item.loadingPrices && (
                                    <div style={S.shimmerRow} className="shopez-pulse">
                                        <span style={S.shimmerDot} />
                                        <span>Discovering prices in {location.seed}...</span>
                                    </div>
                                )}

                                {!item.loadingPrices && (
                                    <div style={S.chipRow}>
                                        {getApps().map(app => {
                                            const appKey = app.name.toLowerCase();
                                            const appPrice = item.prices?.[appKey];
                                            const isCheapest = item.cheapestPlatform === appKey;
                                            
                                            return (
                                                <button
                                                    key={app.name}
                                                    onClick={(e) => { e.stopPropagation(); openApp(app.name, item.text); }}
                                                    style={isCheapest ? { ...S.chip, ...S.chipCheapest } : S.chip}
                                                    title={`Search on ${app.name}`}
                                                >
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: app.color, flexShrink: 0 }} />
                                                    <span>
                                                        {app.name.toUpperCase()}
                                                        {appPrice ? ` • ₹${appPrice}` : ''}
                                                    </span>
                                                    {isCheapest && <Sparkles size={10} style={{ marginLeft: 2 }} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* CARTS OPTIMIZATION PANEL */}
            {itemsWithPricesCount > 0 && cheapestPlatformInfo && (
                <div style={S.optimizerCard}>
                    <div style={S.optimizerHeader} onClick={() => setShowOptimizer(!showOptimizer)}>
                        <div style={S.optimizerTitleBox}>
                            <Sparkles size={14} color="#10B981" />
                            <span style={S.optimizerTitle}>SHOPEZ CART OPTIMIZER</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={S.optimizerBadge}>
                                {cheapestPlatformInfo[0].toUpperCase()} IS BEST VALUE (₹{cheapestPlatformInfo[1]})
                            </span>
                            {showOptimizer ? <ChevronDown size={16} color="#888" /> : <ChevronUp size={16} color="#888" />}
                        </div>
                    </div>

                    {showOptimizer && (
                        <div style={S.optimizerBody}>
                            {potentialSavings > 0 && (
                                <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: '700' }}>
                                    <TrendingDown size={14} />
                                    <span>Buying from {cheapestPlatformInfo[0].toUpperCase()} saves you ₹{potentialSavings} compared to the most expensive platform!</span>
                                </div>
                            )}

                            {sortedTotals.map(([platform, total]) => {
                                const isCheapest = platform === cheapestPlatformInfo[0];
                                const maxVal = mostExpensivePlatformInfo[1];
                                const relativeWidth = maxVal > 0 ? (total / maxVal) * 100 : 0;
                                
                                return (
                                    <div key={platform} style={S.optimizerRow}>
                                        <span style={{ width: '90px', fontWeight: isCheapest ? '700' : '400', color: isCheapest ? '#10B981' : '#9AA0A6' }}>
                                            {platform.toUpperCase()}
                                        </span>
                                        <div style={S.optimizerBarContainer}>
                                            <div 
                                                style={{ 
                                                    ...S.optimizerBar, 
                                                    width: `${relativeWidth}%`,
                                                    backgroundColor: isCheapest ? '#10B981' : '#444'
                                                }} 
                                            />
                                        </div>
                                        <span style={{ width: '45px', textAlign: 'right', fontWeight: isCheapest ? '700' : '400', color: isCheapest ? '#10B981' : '#fff' }}>
                                            ₹{total}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <div style={S.bottomContainer}>
                {totalPrice > 0 && (
                    <div style={S.totalBar}>
                        <span>BEST VALUE BUDGET ESTIMATE ({location.seed})</span>
                        <span>₹{totalPrice}</span>
                    </div>
                )}
                <div style={S.inputBar}>
                    <div style={S.inputWrap}>
                        <Plus color="#5F6368" size={20} />
                        <input
                            ref={inputRef}
                            style={S.input}
                            placeholder="Add item (e.g. eggs, milk, potato)..."
                            onKeyDown={handleInputSubmit}
                        />
                    </div>
                    <button
                        style={{
                            ...S.iconBtn,
                            background: isListening ? '#EF4444' : '#10B981',
                            width: 50, height: 50, borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none'
                        }}
                        onClick={startListening}
                        title={isListening ? 'Listening...' : 'Voice input'}
                    >
                        {isListening ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
                    </button>
                </div>
            </div>

            {/* MENU */}
            {showMenu && (
                <div style={S.menuOverlay} onClick={() => setShowMenu(false)}>
                    <div style={S.menuSheet} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#fff', marginBottom: 16, margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>Your Lists</h3>
                        {lists.map(l => (
                            <div
                                key={l.id}
                                onClick={() => { setActiveId(l.id); setShowMenu(false); }}
                                style={{
                                    padding: '16px 8px', borderBottom: '1px solid #1E1E24',
                                    color: activeId === l.id ? '#8AB4F8' : '#9AA0A6',
                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontWeight: activeId === l.id ? '700' : '400'
                                }}
                            >
                                <span>{l.name}</span>
                                <span style={{ fontSize: 12, color: '#5F6368', fontWeight: '700' }}>
                                    {l.items.length} items
                                </span>
                            </div>
                        ))}

                        {/* New list form */}
                        {showNewListForm ? (
                            <div>
                                <input
                                    autoFocus
                                    style={S.newListInput}
                                    placeholder="List name..."
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newListName.trim()) {
                                            createList(newListName);
                                            setNewListName('');
                                            setShowNewListForm(false);
                                            setShowMenu(false);
                                        }
                                        if (e.key === 'Escape') setShowNewListForm(false);
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                    <button
                                        onClick={() => {
                                            if (newListName.trim()) {
                                                createList(newListName);
                                                setNewListName('');
                                                setShowNewListForm(false);
                                                setShowMenu(false);
                                            }
                                        }}
                                        style={{ flex: 1, background: '#8AB4F8', color: '#000', border: 0, borderRadius: '12px', padding: '12px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => { setShowNewListForm(false); setNewListName(''); }}
                                        style={{ flex: 1, background: '#1C1C21', color: '#9AA0A6', border: '1px solid #2C2C35', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontWeight: '700' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewListForm(true)}
                                style={{ marginTop: 20, color: '#8AB4F8', background: 'transparent', border: 0, fontSize: 15, cursor: 'pointer', padding: '4px 8px', fontWeight: '700' }}
                            >
                                + New List
                            </button>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;
