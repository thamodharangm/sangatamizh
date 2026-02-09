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

    const proxyReq = lib.request(url, { headers: fetchHeaders, timeout: 15000 }, (proxyRes) => {
        // If the source returns an error, don't pipe it as audio
        if (proxyRes.statusCode >= 400) {
            console.error(`[Proxy] Source returned ${proxyRes.statusCode} for ${url}`);
            if (!res.headersSent) res.status(proxyRes.statusCode).end();
            return;
        }

        // Forward status and strictly allowed headers
        res.status(proxyRes.statusCode);
        
        let contentType = proxyRes.headers['content-type'] || 'audio/mpeg';
        
        // Ensure common audio types are properly set
        if (url.includes('.mp3')) contentType = 'audio/mpeg';
        if (url.includes('.m4a')) contentType = 'audio/mp4';

        res.setHeader('Content-Type', contentType);
        
        const allowedHeaders = ['content-length', 'content-range', 'accept-ranges', 'cache-control'];
        allowedHeaders.forEach(h => {
            if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
        });

        // Critical for seeking
        if (proxyRes.headers['accept-ranges'] || url.includes('supabase')) {
            res.setHeader('Accept-Ranges', 'bytes');
        }

        // Always ensure CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

        proxyRes.pipe(res);

        proxyRes.on('error', (err) => {
            console.error('[Proxy] Stream error:', err.message);
            if (!res.writableEnded) res.end();
        });
    });

    proxyReq.on('error', (err) => {
        console.error('[Proxy] Error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Proxy failed' });
    });

    req.on('close', () => proxyReq.destroy());
    proxyReq.end();
};
