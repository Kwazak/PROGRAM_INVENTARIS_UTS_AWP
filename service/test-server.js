// Simple test server
const express = require('express');
const app = express();
const PORT = 3000;

const os = require('os');

function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address
                });
            }
        }
    }

    return addresses;
}

// Simple routes
app.get('/', (req, res) => {
    res.send('<h1>Factory Inventory System</h1><p>Server is running!</p>');
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
    const addresses = getNetworkAddresses();
    
    console.log('============================================================');
    console.log('FACTORY INVENTORY SYSTEM - TEST SERVER');
    console.log('============================================================');
    console.log('Server running on port:', PORT);
    console.log('Started at:', new Date().toLocaleString());
    console.log('============================================================');
    console.log('\nLOCAL ACCESS:');
    console.log('  http://localhost:' + PORT);
    console.log('  http://127.0.0.1:' + PORT);
    
    if (addresses.length > 0) {
        console.log('\nNETWORK ACCESS:');
        addresses.forEach((addr, i) => {
            console.log('  ' + (i+1) + '. ' + addr.interface + ': http://' + addr.address + ':' + PORT);
        });
        console.log('\nFrom other devices, open: http://' + addresses[0].address + ':' + PORT);
    }
    
    console.log('\n============================================================');
    console.log('Press Ctrl+C to stop\n');
});
