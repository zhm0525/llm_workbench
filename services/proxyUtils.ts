// Shared utilities for API exports

export type Logger = (category: 'info' | 'request' | 'response' | 'error', summary: string, details?: any) => void;

export const fetchWithProxy = async (url: string, options: RequestInit, log: Logger) => {
    // Using CorsProxy.io as the sole proxy provider
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl, options);
        return response;
    } catch (e: any) {
        log('error', 'Proxy request failed', { message: e.message, proxy: 'CorsProxy.io' });
        // Throwing error allows the caller (exportService) to catch it 
        // and suggest the "Allow CORS" extension if it's a network/fetch error.
        throw new Error(`Proxy Network Error: ${e.message}`);
    }
};