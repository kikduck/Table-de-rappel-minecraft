#!/usr/bin/env node

const http = require('http');
const os = require('os');

// Obtenir l'adresse IP locale
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();
const port = 3000;

console.log('=== Vérification du serveur ===');
console.log(`IP locale détectée: ${localIP}`);
console.log(`Port testé: ${port}`);

// Test de connexion
const options = {
    hostname: localIP,
    port: port,
    path: '/api/tables',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log('\n✅ SUCCÈS - Serveur accessible !');
    console.log(`Code de statut: ${res.statusCode}`);
    console.log(`URL d'accès: http://${localIP}:${port}`);
    console.log(`API Tables: http://${localIP}:${port}/api/tables`);
    console.log(`API Entries: http://${localIP}:${port}/api/entries`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('\nDonnées reçues:');
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('\nRéponse reçue (non-JSON):');
            console.log(data);
        }
    });
});

req.on('error', (err) => {
    console.log('\n❌ ERREUR - Serveur inaccessible !');
    console.log(`Erreur: ${err.message}`);
    console.log('\nVérifications à faire:');
    console.log('1. Le serveur est-il démarré ? (node backend/server.js)');
    console.log('2. Le port 3000 est-il ouvert sur le firewall ?');
    console.log('3. Le serveur écoute-t-il sur 0.0.0.0 ?');
    console.log('\nCommandes Ubuntu utiles:');
    console.log('- sudo ufw allow 3000');
    console.log('- netstat -tlnp | grep 3000');
    console.log('- lsof -i :3000');
});

req.end();

// Tester également localhost
console.log('\n=== Test localhost ===');
const localhostOptions = {
    hostname: 'localhost',
    port: port,
    path: '/api/tables',
    method: 'GET'
};

const localhostReq = http.request(localhostOptions, (res) => {
    console.log('✅ Localhost accessible');
});

localhostReq.on('error', (err) => {
    console.log('❌ Localhost inaccessible:', err.message);
});

localhostReq.end(); 