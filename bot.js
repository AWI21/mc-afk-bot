const mineflayer = require('mineflayer');
const http = require('http');
const config = require('./config.json');

// --- 1. SERWER HTTP DLA RENDERA (Health Check) ---
http.createServer((req, res) => {
    res.write('Bot is Ultra-Humanized and active!');
    res.end();
}).listen(process.env.PORT || 8080);

const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 2. PŁYNNE OBRACANIE GŁOWY (Bypass Anty-Cheata) ---
// Zamiast natychmiastowego obrotu, bot przesuwa wzrok w małych krokach
async function smoothLook(bot) {
    const targetYaw = (Math.random() * Math.PI * 2);
    const targetPitch = ((Math.random() - 0.5) * Math.PI);
    
    // Dzielimy obrót na 10 małych ruchów
    for (let i = 0; i < 10; i++) {
        if (!bot.entity) return;
        const currentYaw = bot.entity.yaw;
        const currentPitch = bot.entity.pitch;
        
        await bot.look(
            currentYaw + (targetYaw - currentYaw) * 0.1,
            currentPitch + (targetPitch - currentPitch) * 0.1,
            true // true oznacza pominięcie domyślnej animacji skoku
        );
        await sleep(40); // Czekamy chwilę między krokami
    }
}

// --- 3. LOGIKA RUCHU (Humanized) ---
async function movementCycle(bot) {
    if (!bot || !bot.entity) return;

    const playerCount = Object.keys(bot.players).length;
    if (playerCount <= 1) {
        console.log('⚠️ Sam na serwerze - bezpieczne wyjście.');
        bot.quit();
        return;
    }

    bot.clearControlStates();
    const action = getRandom(0, 6);

    switch (action) {
        case 0: // Idź do przodu przez losowy czas
            bot.setControlState('forward', true);
            await sleep(getRandom(500, 1500));
            bot.setControlState('forward', false);
            break;
        case 1: // Idź do tyłu przez losowy czas
            bot.setControlState('back', true);
            await sleep(getRandom(500, 1500));
            bot.setControlState('back', false);
            break;
        case 2: // Skok
            bot.setControlState('jump', true);
            await sleep(getRandom(100, 300));
            bot.setControlState('jump', false);
            break;
        case 3: // Płynne rozejrzenie się
            await smoothLook(bot);
            break;
        case 4: // Machnięcie ręką
            bot.swingArm('right');
            break;
        case 5: // Kliknięcie Shiftem (sneak)
            bot.setControlState('sneak', true);
            await sleep(getRandom(500, 2000));
            bot.setControlState('sneak', false);
            break;
        case 6: // Dłuższe stanie w miejscu (symulacja czytania czatu)
            await sleep(getRandom(2000, 5000));
            break;
    }

    const nextTick = getRandom(1500, 6000);
    setTimeout(() => movementCycle(bot), nextTick);
}

// --- 4. SYSTEM TWORZENIA BOTA ---
function initBot() {
    console.log('--- Łączenie w trybie Ultra-Safe ---');
    
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
            console.log(`✅ ${config.botUsername} gotowy. Graczy online: ${Object.keys(bot.players).length}`);
            movementCycle(bot);
        }, 5000);
    });

    // LOGOWANIE CZATU DO KONSOLI
    // Dzięki temu na Renderze zobaczysz, czy admin pisał do bota!
    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        if (message.trim().length > 0) {
            console.log(`[CZAT]: ${message}`);
        }
    });

    bot.on('error', (err) => console.error('⚠️ Błąd:', err));

    bot.on('end', () => {
        const playersBeforeEnd = Object.keys(bot.players || {}).length;
        const waitTime = playersBeforeEnd <= 1 ? 600000 : 45000; // 10 min jeśli sam, 45s jeśli błąd
        console.log(`⛔ Rozłączono. Następna próba za ${waitTime/1000}s...`);
        setTimeout(initBot, waitTime);
    });

    bot.on('kicked', (reason) => {
        console.log('❌ Zostałeś wyrzucony! Powód:', reason);
    });
}

initBot();
