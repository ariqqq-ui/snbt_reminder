const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Hapus file lock Chromium
const sessionDir = '/app/.wwebjs_auth';
if (fs.existsSync(sessionDir)) {
    const findAndDeleteLocks = (dir) => {
        try {
            fs.readdirSync(dir).forEach(f => {
                const fullPath = path.join(dir, f);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        findAndDeleteLocks(fullPath);
                    } else if (['SingletonLock','SingletonCookie','SingletonSocket'].includes(f)) {
                        fs.unlinkSync(fullPath);
                        console.log(`Hapus lock: ${fullPath}`);
                    }
                } catch (e) {}
            });
        } catch (e) {}
    };
    findAndDeleteLocks(sessionDir);
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/app/.wwebjs_auth'
    }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

const GROUP_ID = 'GRUP_ID_KAMU@g.us'; // ← ganti nanti
const TANGGAL_SNBT = new Date('2026-06-17'); // ← sesuaikan tanggal SNBT

let qrImageUrl = null;
let botReady = false;

// Web server untuk tampilkan QR
const server = http.createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (botReady) {
        res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:50px">
                <h1>✅ Bot Aktif!</h1>
                <p>WhatsApp sudah terhubung dan bot berjalan.</p>
            </body></html>
        `);
    } else if (qrImageUrl) {
        res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:20px">
                <h2>Scan QR ini dengan WhatsApp</h2>
                <p>Buka WA → Linked Devices → Scan QR</p>
                <img src="${qrImageUrl}" style="width:300px;height:300px"/>
                <p><small>Refresh halaman jika QR expired</small></p>
            </body></html>
        `);
    } else {
        res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:50px">
                <h2>⏳ Memuat QR...</h2>
                <p>Tunggu beberapa detik lalu refresh halaman ini.</p>
            </body></html>
        `);
    }
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Web server aktif!');
});

function hitungHari() {
    const hari_ini = new Date();
    hari_ini.setHours(0, 0, 0, 0);
    const selisih = Math.ceil((TANGGAL_SNBT - hari_ini) / (1000 * 60 * 60 * 24));
    if (selisih > 0) return `H-${selisih} menuju Pengumuman SNBT! 💪\nTetap semangat dan jaga kesehatan!`;
    if (selisih === 0) return `🎉 Hari ini Pengumuman SNBT! Semoga hasilnya terbaik!`;
    return `Pengumuman SNBT sudah berlalu ${Math.abs(selisih)} hari yang lalu.`;
}

client.on('qr', async (qr) => {
    console.log('QR baru dibuat, buka link Railway untuk scan!');
    qrImageUrl = await qrcode.toDataURL(qr);
});

client.on('ready', async () => {
    botReady = true;
    qrImageUrl = null;
    console.log('✅ Bot WhatsApp siap!');

    // Tampilkan ID semua grup di logs
    const chats = await client.getChats();
    chats.forEach(chat => {
        if (chat.isGroup) {
            console.log(`Nama: ${chat.name} | ID: ${chat.id._serialized}`);
        }
    });

    // Kirim pesan setiap hari jam 07.00 WIB
    cron.schedule('0 7 * * *', async () => {
        const pesan = hitungHari();
        await client.sendMessage(GROUP_ID, pesan);
        console.log('Pesan terkirim:', pesan);
    }, { timezone: "Asia/Jakarta" });
});

client.initialize();
