const fs = require('fs');

console.log('Reading server.js.corrupted.bak...');
let content = fs.readFileSync('server.js.corrupted.bak', 'utf8');

console.log('Removing all emoji characters...');

// Remove specific emojis we know about
const emojiReplacements = [
    { from: '🏭', to: '' },
    { from: '🚀', to: '' },
    { from: '📅', to: '' },
    { from: '🌍', to: '' },
    { from: '💡', to: '' },
    { from: '⚠️', to: '' },
    { from: '✅', to: '' },
    { from: '🔔', to: '[CRON]' },
    { from: '💾', to: '' },
    { from: '📊', to: '' },
    { from: '🌐', to: '' }
];

emojiReplacements.forEach(({ from, to }) => {
    content = content.split(from).join(to);
});

// Also remove any other emoji using regex (Unicode ranges)
// This covers most emojis
content = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
content = content.replace(/[\u{2600}-\u{26FF}]/gu, '');
content = content.replace(/[\u{2700}-\u{27BF}]/gu, '');

console.log('Writing fixed server.js...');
fs.writeFileSync('server.js', content, 'utf8');

console.log('✓ Done! server.js has been fixed (all emojis removed)');
console.log('You can now run: npm start');
