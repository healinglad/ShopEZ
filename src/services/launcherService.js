
/**
 * Shopez Launcher Service (v5.1 - Grocery Targeted)
 */

const APPS = {
    BLINKIT: {
        name: 'Blinkit',
        web: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
        color: '#F8CB46'
    },
    ZEPTO: {
        name: 'Zepto',
        web: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
        color: '#36096d'
    },
    INSTAMART: {
        name: 'Instamart',
        intent: (q) => `swiggy://instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
        web: (q) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
        color: '#FC8019'
    },
    BIGBASKET: {
        name: 'BigBasket',
        web: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
        color: '#84C225'
    },
    FLIPKART: {
        name: 'Flipkart',
        intent: (q) => `https://dl.flipkart.com/dl/search?q=${encodeURIComponent(q)}&marketplace=GROCERY`,
        web: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}&marketplace=GROCERY`,
        color: '#2874F0'
    }
};

export function getApps() { return Object.values(APPS); }

export function openApp(appName, query) {
    const app = Object.values(APPS).find(a => a.name === appName);
    if (!app) return;
    // Pass raw query — each URL builder handles encoding internally
    if (/Android/i.test(navigator.userAgent)) {
        if (app.intent) window.location.href = app.intent(query);
        else window.location.href = app.web(query);
    } else {
        window.open(app.web(query), '_blank');
    }
}
