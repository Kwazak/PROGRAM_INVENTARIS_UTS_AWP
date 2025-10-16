// Force Logout All Users - Clear localStorage
// Run this in browser console to force all users to re-login

console.log('🔄 Forcing logout to refresh permissions...');

// Clear all localStorage
localStorage.clear();

// Show message
alert('Permissions telah diupdate!\n\nAnda akan logout otomatis.\nSilahkan LOGIN ULANG untuk menggunakan permissions baru.');

// Redirect to login
setTimeout(() => {
    window.location.href = '/login.html';
}, 1000);
