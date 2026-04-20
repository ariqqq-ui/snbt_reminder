const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const { execSync } = require('child_process');

// Paksa hapus semua lock
try {
    execSync('find /app/.wwebjs_auth -name "Singleton*" -delete 2>/dev/null || true');
    execSync('find /app/.wwebjs_auth -name "lockfile" -delete 2>/dev/null || true');
    execSync('pkill -f chromium 2>/dev/null || true');
    execSync('pkill -f chrome 2>/dev/null || true');
    console.log('Lock berhasil dibersihkan!');
} catch(e) {
    console.log('Proses pembersihan selesai.');
}

const GROUP_ID = '120363318529799636@g.us';
const TANGGAL_PENGUMUMAN = new Date('2026-05-25');

let qrImageUrl = null;
let botReady = false;
let cronJob = null;

function buatClient() {
    return new Client({
        authStrategy: new LocalAuth({
            dataPath: '/app/.wwebjs_auth'
        }),
        puppeteer: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ],
            protocolTimeout: 60000
        }
    });
}

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
    return Math.ceil((TANGGAL_PENGUMUMAN - hari_ini) / (1000 * 60 * 60 * 24));
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

    if (selisih > 7) return pesanJauh[Math.floor(Math.random() * pesanJauh.length)];
    if (selisih > 1) return pesanDekat[Math.floor(Math.random() * pesanDekat.length)];
    if (selisih === 1) return pesanBesok[Math.floor(Math.random() * pesanBesok.length)];
    return pesanHariIni[Math.floor(Math.random() * pesanHariIni.length)];
}

function mulaiBot() {
    const client = buatClient();

    client.on('qr', async (qr) => {
        botReady = false;
        console.log('QR baru dibuat, buka link Railway untuk scan!');
        qrImageUrl = await qrcode.toDataURL(qr);
    });

    client.on('ready', async () => {
        botReady = true;
        qrImageUrl = null;
        console.log('✅ Bot WhatsApp siap!');

        // Batalkan cron lama jika ada
        if (cronJob) {
            cronJob.stop();
        }

        // Kirim pesan setiap hari jam 07.00 WIB
        cronJob = cron.schedule('0 7 * * *', async () => {
            const selisih = hitungHari();
            if (selisih < 0) {
                console.log('Pengumuman sudah berlalu. Bot berhenti kirim pesan.');
                return;
            }
            try {
                const pesan = pesanHarian(selisih);
                await client.sendMessage(GROUP_ID, pesan);
                console.log('Pesan terkirim:', pesan);
            } catch(e) {
                console.log('Gagal kirim pesan:', e.message);
            }
        }, { timezone: "Asia/Jakarta" });
    });

    client.on('disconnected', (reason) => {
        botReady = false;
        console.log('Bot terputus:', reason);
        console.log('Mencoba reconnect dalam 10 detik...');
        setTimeout(() => {
            mulaiBot();
        }, 10000);
    });

    client.on('auth_failure', (msg) => {
        botReady = false;
        console.log('Auth gagal:', msg);
    });

    process.on('uncaughtException', (err) => {
        console.log('Error tidak terduga:', err.message);
    });

    process.on('unhandledRejection', (err) => {
        console.log('Promise error:', err.message);
    });

    client.initialize().catch(err => {
        console.log('Gagal initialize:', err.message);
        setTimeout(() => mulaiBot(), 10000);
    });
}

mulaiBot();
