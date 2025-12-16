// Simple test to see if server can start
console.log('Starting test server...');

try {
    const app = require('./src/app');
    const PORT = 3002;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Test server running on port ${PORT}`);
    });
    
    // Keep alive
    process.on('SIGINT', () => {
        console.log('Shutting down...');
        server.close();
        process.exit(0);
    });
    
} catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
}
