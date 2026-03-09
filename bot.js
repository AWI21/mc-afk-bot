const mineflayer = require('mineflayer');
const http = require('http');
const config = require('./config.json');

// --- 1. SERWER HTTP DLA RENDERA (Health Check) ---
http.createServer((req, res) => {
    res.write('Bot is Ultra-Humanized and active 24/7!');
    res.end();
}).listen(process.env.PORT || 8080);

const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let globalBot; // Zmienna do obsługi restartów

// --- 2. PŁYNNE OBRACANIE GŁOWY (Bypass Anty-Cheata) ---
async function smoothLook(bot) {
    const targetYaw = (Math.random() * Math.PI * 2);
    const targetPitch = ((Math.random() - 0.5) * Math.PI);
    
    for (let i = 0; i < 10; i++) {
        if (!bot.entity) return;
        const currentYaw = bot.entity.yaw;
        const currentPitch = bot.entity.pitch;
        
        await bot.look(
            currentYaw + (targetYaw - currentYaw) * 0.1,
            currentPitch + (targetPitch - currentPitch) * 0.1,
            true 
        );
        await sleep(40); 
    }
}

// --- 3. LOGIKA RUCHU (Humanized & Persistent) ---
async function movementCycle(bot) {
    if (!bot || !bot.entity) return;

    // USUNIĘTO: bot.quit() gdy playerCount <= 1 (Bot zostaje 24/7)

    bot.clearControlStates();
    const action = getRandom(0, 6);

    switch (action) {
        case 0: // Idź do przodu
            bot.setControlState('forward', true);
            await sleep(getRandom(500, 1500));
            bot.setControlState('forward', false);
            break;
        case 1: // Idź do tyłu
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
        case 5: // Kliknięcie Shiftem
            bot.setControlState('sneak', true);
            await sleep(getRandom(500, 2000));
            bot.setControlState('sneak', false);
            break;
        case 6: // Pauza
            await sleep(getRandom(2000, 5000));
            break;
    }

    const nextTick = getRandom(1500, 6000);
    setTimeout(() => movementCycle(bot), nextTick);
}

// --- 4. SYSTEM TWORZENIA BOTA ---
function initBot() {
    console.log('--- Łączenie w trybie Non-Stop Ultra-Safe ---');
    
    const bot = mineflayer.createBot({
        host: config.serverHost,
        port: config.serverPort,
        username: config.botUsername,
        auth: 'offline',
        version: false,
        viewDistance: config.botChunk
    });

    globalBot = bot;

    bot.on('spawn', () => {
        setTimeout(() => {
            console.log(`✅ ${config.botUsername} gotowy. Tryb 24/7 aktywny.`);
            movementCycle(bot);
        }, 5000);
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        if (message.trim().length > 0) {
            console.log(`[CZAT]: ${message}`);
        }
    });

    bot.on('error', (err) => console.error('⚠️ Błąd:', err));

    bot.on('end', () => {
        // Skrócono czas oczekiwania do 15 sekund, by bot nie wypadał z limitów czasowych serwera
        console.log(`⛔ Rozłączono. Natychmiastowy powrót za 15s...`);
        setTimeout(initBot, 15000);
    });

    bot.on('kicked', (reason) => {
        console.log('❌ Zostałeś wyrzucony! Powód:', reason);
    });
}

// --- 5. AUTOMATYCZNE ODŚWIEŻANIE SESJI (Co 4 godziny) ---
// Zapobiega banom po 8h na silnikach Bukkit/Spigot
setInterval(() => {
    if (globalBot) {
        console.log('🔄 Autorestart sesji (Szybkie odświeżenie IP/Tokena)...');
        globalBot.quit();
    }
}, 14400000);

initBot();
