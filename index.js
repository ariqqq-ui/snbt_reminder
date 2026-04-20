const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Hapus file lock Chromium
const sessionDir = '/app/.wwebjs_auth';
const deleteAllLocks = (dir) => {
    if (!fs.existsSync(dir)) return;
    try {
        fs.readdirSync(dir).forEach(f => {
            const fullPath = path.join(dir, f);
            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    deleteAllLocks(fullPath);
                } else if (f.startsWith('Singleton') || f === 'lockfile') {
                    fs.unlinkSync(fullPath);
                    console.log(`Hapus lock: ${fullPath}`);
                }
            } catch(e) {}
        });
    } catch(e) {}
};
deleteAllLocks(sessionDir);

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
        ],
        protocolTimeout: 60000
    }
});

const GROUP_ID = '120363318529799636@g.us'; // ← ganti dengan ID grup
const TANGGAL_PENGUMUMAN = new Date('2026-05-25'); // ← ganti tanggal pengumuman hasil SNBT

let qrImageUrl = null;
let botReady = false;

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
    const selisih = Math.ceil((TANGGAL_PENGUMUMAN - hari_ini) / (1000 * 60 * 60 * 24));
    return selisih;
}

function pesanHarian(selisih) {
    const pesanJauh = [
        `📅 *H-${selisih} Pengumuman Hasil SNBT!*\nSabar ya, waktunya masih ada. Sambil nunggu, tetap produktif dan jaga mental kalian! 💪`,
        `⏳ *H-${selisih} menuju Pengumuman SNBT!*\nMasih lama, tapi waktu cepat berlalu! Manfaatkan masa penantian ini dengan hal-hal positif. 🌟`,
        `🌈 *Countdown Pengumuman SNBT: H-${selisih}*\nSemua sudah dilakukan, sekarang waktunya tawakal dan berdoa. Yang terbaik pasti datang! 🙏`,
        `💡 *H-${selisih} lagi pengumuman!*\nNikmati waktu menunggu ini. Istirahat, jalan-jalan, atau lakukan hobi yang tertunda. Kalian sudah berjuang keras! 😊`,
        `🎯 *H-${selisih} Pengumuman Hasil SNBT!*\nUsaha sudah selesai, hasilnya tinggal ditunggu. Percaya bahwa Allah sudah menyiapkan yang terbaik! ✨`,
    ];

    const pesanDekat = [
        `🔥 *H-${selisih} Pengumuman SNBT!*\nSudah semakin dekat! Deg-degan itu wajar, tapi tetap positive thinking ya! 😤`,
        `⚡ *Tinggal H-${selisih} lagi pengumuman!*\nJantung mulai berdegup kencang? Itu tandanya kamu peduli dengan masa depanmu. Tetap tenang! 💨`,
        `🏃 *H-${selisih} menuju hari pengumuman!*\nSebentar lagi penantian berakhir! Apapun hasilnya, kalian sudah melakukan yang terbaik. 🙌`,
        `😤 *H-${selisih} lagi guys!*\nSabar ya sebentar lagi! Doain satu sama lain supaya hasilnya memuaskan. Semangat! ✊`,
        `🌠 *Hampir tiba! H-${selisih} pengumuman!*\nWaktu penantian hampir usai. Tetap berdoa dan percaya diri! 🙏`,
    ];

    const pesanBesok = [
        `😱 *BESOK PENGUMUMAN SNBT! H-1!*\nBesok hari yang ditunggu-tunggu akhirnya tiba! Malam ini berdoa yang khusyuk dan tidur yang cukup. Semoga hasilnya membahagiakan! 🌙`,
        `🌙 *H-1 Pengumuman SNBT!*\nSatu malam lagi! Apapun hasilnya besok, ingat bahwa satu pintu tertutup berarti ada pintu lain yang terbuka. Tetap semangat! ⭐`,
    ];

    const pesanHariIni = [
        `🎉 *HARI INI PENGUMUMAN SNBT!*\nSaatnya cek hasil perjuangan kalian! Bismillah, semoga hasilnya sesuai harapan. Apapun hasilnya, kalian tetap luar biasa! 🏆`,
        `🌟 *PENGUMUMAN SNBT HARI INI!*\nMomen yang ditunggu-tunggu akhirnya tiba! Buka pengumuman dengan hati yang lapang. Doa kami menyertai kalian semua! 💫`,
    ];

    if (selisih > 7) {
        return pesanJauh[Math.floor(Math.random() * pesanJauh.length)];
    } else if (selisih > 1) {
        return pesanDekat[Math.floor(Math.random() * pesanDekat.length)];
    } else if (selisih === 1) {
        return pesanBesok[Math.floor(Math.random() * pesanBesok.length)];
    } else {
        return pesanHariIni[Math.floor(Math.random() * pesanHariIni.length)];
    }
}

client.on('qr', async (qr) => {
    console.log('QR baru dibuat, buka link Railway untuk scan!');
    qrImageUrl = await qrcode.toDataURL(qr);
});

client.on('ready', async () => {
    botReady = true;
    qrImageUrl = null;
    console.log('✅ Bot WhatsApp siap!');

    // Tunggu 10 detik agar WA selesai load
    setTimeout(async () => {
        try {
            const chats = await client.getChats();
            console.log(`Total chat: ${chats.length}`);
            chats.forEach(chat => {
                if (chat.isGroup) {
                    console.log(`Nama: ${chat.name} | ID: ${chat.id._serialized}`);
                }
            });
        } catch(e) {
            console.log('Gagal ambil grup:', e.message);
        }
    }, 10000);

    // Kirim pesan setiap hari jam 07.00 WIB
    cron.schedule('0 7 * * *', async () => {
        const selisih = hitungHari();

        // Berhenti kirim jika sudah lewat hari pengumuman
        if (selisih < 0) {
            console.log('Pengumuman SNBT sudah berlalu. Bot berhenti kirim pesan.');
            return;
        }

        const pesan = pesanHarian(selisih);
        await client.sendMessage(GROUP_ID, pesan);
        console.log('Pesan terkirim:', pesan);
    }, { timezone: "Asia/Jakarta" });

    // Cetak ID grup saat ada pesan masuk
    client.on('message', async (msg) => {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            console.log(`Grup - Nama: ${chat.name} | ID: ${chat.id._iserialised}`);
        }
    });
});

client.initialize();
