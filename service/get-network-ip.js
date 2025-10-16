const os = require('os');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
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

console.log('🌐 NETWORK CONFIGURATION FOR REMOTE ACCESS');
console.log('='.repeat(60));
console.log('\n📱 Your Local IP Addresses:\n');

const addresses = getLocalIPAddress();

if (addresses.length === 0) {
    console.log('❌ No network interfaces found!');
    console.log('   Make sure you are connected to WiFi or Ethernet.');
} else {
    addresses.forEach((addr, index) => {
        console.log(`${index + 1}. Interface: ${addr.interface}`);
        console.log(`   IP Address: ${addr.address}`);
        console.log(`   Access URL: http://${addr.address}:3000`);
        console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n💡 QUICK GUIDE:\n');
    console.log('1. Start server: npm start (or node server.js)');
    console.log('2. On another device (same WiFi):');
    console.log(`   Open browser: http://${addresses[0].address}:3000`);
    console.log('3. Login with your credentials');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   • Both devices must be on the SAME WiFi network');
    console.log('   • Windows Firewall must allow port 3000');
    console.log('   • If connection fails, check firewall settings');
    console.log('');
}

console.log('='.repeat(60));
console.log('\n🔧 TROUBLESHOOTING:\n');
console.log('If you cannot connect from another device:');
console.log('');
console.log('1. Check Windows Firewall:');
console.log('   • Open: Windows Defender Firewall');
console.log('   • Allow an app → Node.js → Check both Private & Public');
console.log('');
console.log('2. Or add firewall rule (Run as Administrator):');
console.log('   netsh advfirewall firewall add rule name="Node.js Server"');
console.log('   dir=in action=allow protocol=TCP localport=3000');
console.log('');
console.log('3. Test connection from same PC:');
console.log(`   curl http://localhost:3000`);
console.log('');
console.log('4. Test from another device:');
if (addresses.length > 0) {
    console.log(`   curl http://${addresses[0].address}:3000`);
}
console.log('   Or open browser and navigate to the URL');
console.log('');
console.log('='.repeat(60));
