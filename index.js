const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('Scan QR ini dengan HP kamu:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Bot siap! Daftar grup kamu:');
    console.log('================================');
    
    const chats = await client.getChats();
    chats.forEach(chat => {
        if (chat.isGroup) {
            console.log(`Nama Grup : ${chat.name}`);
            console.log(`ID Grup   : ${chat.id._serialized}`);
            console.log('--------------------------------');
        }
    });
});

client.initialize();