import QRCode from 'qrcode';

async function run() {
    const str = await QRCode.toString('12345', { 
        type: 'svg', 
        margin: 1, 
        color: { dark: '#000000', light: '#ffffff' } 
    });
    console.log("--- QR OUTPUT START ---");
    console.log(str);
    console.log("--- QR OUTPUT END ---");
}

run();
