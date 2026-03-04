const mineflayer = require('mineflayer');
const http = require('http');
const config = require('./config.json');

// --- 1. SERWER HTTP DLA RENDERA ---
http.createServer((req, res) => {
    res.write('Bot is humanized and active!');
    res.end();
}).listen(process.env.PORT || 8080);

// Pomocnicza funkcja do losowania czasu i liczb
const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// --- 2. ULEPSZONA LOGIKA RUCHU (Humanized) ---
function movementCycle(bot) {
    if (!bot || !bot.entity) return;

    // Sprawdzenie liczby graczy (bot.players zawiera też samego bota)
    const playerCount = Object.keys(bot.players).length;
    
    if (playerCount <= 1) {
        console.log('⚠️ Zostałem sam na serwerze. Bezpieczne rozłączanie...');
        bot.quit(); 
        return; // Zatrzymuje pętlę ruchu
    }

    // Czyścimy poprzednie stany (puszczamy klawisze)
    bot.clearControlStates();

    // Losujemy akcję (0-5)
    const action = getRandom(0, 5);

    switch (action) {
        case 0: // Idź do przodu
            bot.setControlState('forward', true);
            break;
        case 1: // Idź do tyłu
            bot.setControlState('back', true);
            break;
        case 2: // Skok
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), getRandom(200, 500));
            break;
        case 3: // Rozglądanie się (zmiana głowy)
            const yaw = (Math.random() * Math.PI * 2);
            const pitch = ((Math.random() - 0.5) * Math.PI);
            bot.look(yaw, pitch);
            break;
        case 4: // Machnięcie ręką
            bot.swingArm('right');
            break;
        case 5: // Pauza (stanie w miejscu)
            break;
    }

    // Losowy czas do następnej akcji (od 1s do 4s) - to klucz do Anty-Cheata
    const nextTick = getRandom(1000, 4000);
    setTimeout(() => movementCycle(bot), nextTick);
}

// --- 3. SYSTEM TWORZENIA BOTA I RECONNECTU ---
function initBot() {
    console.log('--- Próba połączenia (Tryb Humanizowany) ---');
    
    const bot = mineflayer.createBot({
        host: config.serverHost,
        port: config.serverPort,
        username: config.botUsername,
        auth: 'offline',
        version: false,
        viewDistance: config.botChunk
    });

    bot.on('spawn', () => {
        setTimeout(() => {
            bot.setControlState('sneak', true);
            console.log(`✅ ${config.botUsername} jest online. Graczy: ${Object.keys(bot.players).length}`);
            movementCycle(bot);
        }, 3000);
    });

    bot.on('error', (err) => {
        console.error('⚠️ Błąd:', err);
    });

    bot.on('end', () => {
        // Jeśli bot wyszedł, bo był sam, czekamy dłużej (5 min)
        // Jeśli go wyrzuciło, czekamy standardowo 30 sek.
        const waitTime = Object.keys(bot.players || {}).length <= 1 ? 300000 : 30000;
        console.log(`⛔️ Rozłączono. Reconnect za ${waitTime/1000}s...`);
        setTimeout(initBot, waitTime);
    });

    bot.on('kicked', (reason) => {
        console.log('❌ Kick:', reason);
    });
}

initBot();
