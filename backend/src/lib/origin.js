import dotenv from "dotenv";
dotenv.config();

/**
 * Checks if a given hostname is a local IP address.
 * Covers:
 * - 127.0.0.1, localhost, ::1
 * - 10.x.x.x (Private Class A)
 * - 172.16.x.x - 172.31.x.x (Private Class B)
 * - 192.168.x.x (Private Class C)
 */
const isLocalOrigin = (origin) => {
    if (!origin) return true; // Allow requests with no origin (like mobile apps, curl, etc.)

    try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // Localhost and loopback
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;

        // Check for private IP ranges
        const parts = hostname.split('.');
        if (parts.length === 4) {
            const p1 = parseInt(parts[0], 10);
            const p2 = parseInt(parts[1], 10);

            // 10.0.0.0 – 10.255.255.255
            if (p1 === 10) return true;

            // 172.16.0.0 – 172.31.255.255
            if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;

            // 192.168.0.0 – 192.168.255.255
            if (p1 === 192 && p2 === 168) return true;
        }

        // Support for inc1.devtunnels.ms and other development tunnels if needed
        if (hostname.endsWith('.devtunnels.ms')) return true;

    } catch (e) {
        // If it's not a valid URL, it might be a direct IP or something else
        // We can be more restrictive here or use regex
        const ipRegex = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;
        if (ipRegex.test(origin)) return true;
    }
    return false;
};

/**
 * Custom origin check function for CORS and Socket.io
 */
export const checkOrigin = (origin, callback) => {
    const frontendUrls = process.env.FRONTEND_URLS ?
        process.env.FRONTEND_URLS.split(',').map(url => url.trim()) :
        [];

    // If environment allows all, just return true
    if (frontendUrls.includes('*')) {
        return callback(null, true);
    }

    // Allow if:
    // 1. No origin (direct request)
    // 2. Local network origin
    // 3. Specifically allowed in .env
    if (!origin || isLocalOrigin(origin) || frontendUrls.includes(origin)) {
        callback(null, true);
    } else {
        // Log blocked origin for debugging
        console.warn(`⚠️ Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    }
};
