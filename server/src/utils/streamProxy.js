import https from 'https';
import http from 'http';

export const streamProxy = (url, req, res) => {
    const fetchHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
    }

    const lib = url.startsWith('https') ? https : http;

    const proxyReq = lib.request(url, { headers: fetchHeaders }, (proxyRes) => {
        // Forward status and headers
        res.status(proxyRes.statusCode);
        
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            if (['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key)) {
                res.setHeader(key, value);
            }
        });

        // Always ensure CORS
        res.setHeader('Access-Control-Allow-Origin', '*');

        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[Proxy] Error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Proxy failed' });
    });

    req.on('close', () => proxyReq.destroy());
    proxyReq.end();
};
