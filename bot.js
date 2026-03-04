const mineflayer = require('mineflayer');
const http = require('http');
const config = require('./config.json');

// --- 1. SERWER HTTP DLA RENDERA (Health Check) ---
http.createServer((req, res) => {
    res.write('Bot is running and moving!');
    res.end();
}).listen(process.env.PORT || 8080);

// --- 2. LOGIKA RUCHU (Zachowana z Twojego kodu) ---
let movementPhase = 0;
const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;

function movementCycle(bot) {
    // Sprawdzamy, czy bot w ogóle istnieje i czy jest na serwerze
    if (!bot || !bot.entity) return;

    switch (movementPhase) {
        case 0:
            bot.setControlState('forward', true);
            bot.setControlState('back', false);
            bot.setControlState('jump', false);
            break;
        case 1:
            bot.setControlState('forward', false);
            bot.setControlState('back', true);
            bot.setControlState('jump', false);
            break;
        case 2:
            bot.setControlState('forward', false);
            bot.setControlState('back', false);
            bot.setControlState('jump', true);
            setTimeout(() => { if(bot.entity) bot.setControlState('jump', false); }, JUMP_DURATION);
            break;
        case 3:
            bot.setControlState('forward', false);
            bot.setControlState('back', false);
            bot.setControlState('jump', false);
            break;
    }

    movementPhase = (movementPhase + 1) % 4;
    
    // Ważne: Planujemy następny krok tylko dla aktualnego bota
    setTimeout(() => movementCycle(bot), STEP_INTERVAL);
}

// --- 3. SYSTEM TWORZENIA BOTA I RECONNECTU ---
function initBot() {
    console.log('--- Rozpoczynam łączenie z serwerem ---');
    
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
            console.log(`✅ ${config.botUsername} jest na serwerze i zaczyna taniec!`);
            movementCycle(bot); // Startujemy ruch
        }, 3000);
    });

    bot.on('error', (err) => {
        console.error('⚠️ Błąd bota:', err);
    });

    bot.on('end', () => {
        console.log('⛔️ Rozłączono! Próba powrotu za 15 sekund...');
        
        // Czyścimy flagi ruchu, żeby po spawnie nie było błędów
        movementPhase = 0;

        // Kluczowe: Próba ponownego uruchomienia po czasie
        setTimeout(initBot, 15000);
    });

    // Obsługa wyrzucenia z serwera
    bot.on('kicked', (reason) => {
        console.log('❌ Wyrzucony z serwera za:', reason);
    });
}

// Odpalamy maszynę!
initBot();
