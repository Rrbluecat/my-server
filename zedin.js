const fs = require('fs');
const path = require('path');
const http = require('http');

const koruma = require('./koruma');
const optimizasyon = require('./optimizasyon');

const TIPLER = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.zs': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json'
};

const Metin = {
    temizle: (m) => {
        if(typeof m !== 'string') return m;
        return m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
};

const Sistem = {
    log_yaz: (mesaj) => {
        const log = `[${new Date().toLocaleString()}] ${mesaj}\n`;
        fs.appendFile('sunucu.log', log, () => {});
    },
    bellek_kullanımı: () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    yeniden_başlat: () => { console.log("ZedinScript Yenileniyor..."); process.exit(0); }
};

const Ag = {
    sunucu_kur: (islem) => {
        return http.createServer((istek, yanit) => {
            const ip = istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

            // --- GÜVENLİK DUVARI ---
            if (!koruma.hizSiniri(ip) || !koruma.sorguKontrol(istek.url)) {
                koruma.basliklariAyarla(yanit);
                yanit.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
                return yanit.end("Erisim Engellendi");
            }

            koruma.basliklariAyarla(yanit);

            // --- YANIT METOTLARI ---
            yanit.gönder = (mesaj, stat = 200) => {
                yanit.writeHead(stat, {'Content-Type': 'text/html; charset=utf-8'});
                yanit.end(mesaj);
            };
            yanit.dosya_gönder = (yol) => {
                const tamYol = path.join(process.cwd(), path.normalize(yol).replace(/^(\.\.(\/|\\|$))+/, ''));
                if (fs.existsSync(tamYol)) {
                    const uzanti = path.extname(tamYol);
                    yanit.writeHead(200, {'Content-Type': TIPLER[uzanti] || 'text/plain'});
                    fs.createReadStream(tamYol).pipe(yanit);
                } else { yanit.writeHead(404); yanit.end("404"); }
            };
            yanit.yönlendir = (yol) => { yanit.writeHead(302, {'Location': yol}); yanit.end(); };
            yanit.çerez_ayarla = (isim, deger) => {
                yanit.setHeader('Set-Cookie', `${isim}=${deger}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600`);
            };

            islem(istek, yanit);
        });
    },
    çerez_oku: (istek) => {
        const liste = {};
        const rc = istek.headers.cookie;
        if (rc) rc.split(';').forEach(c => { const p = c.split('='); liste[p.shift().trim()] = decodeURI(p.join('=')); });
        return liste;
    },
    post_yakala: (istek, geri_donus) => {
        let govde = '';
        istek.on('data', p => { if(govde.length < 500000) govde += p; });
        istek.on('end', () => { geri_donus(Object.fromEntries(new URLSearchParams(govde))); });
    },
   // zedin.js içindeki Ag objesinin dinle metodu
   dinle: (sunucu, kapi) => {
       // Railway'in verdiği portu al, yoksa kapi'yi kullan, o da yoksa 8080
    const port = process.env.PORT ||
 kapi || 8080;

    sunucu.on('error', (hata) => {
        if (hata.code === 'EADDRINUSE') {
{
            // Port doluysa bekçiye haber ver ama hemen ölme
            console.error(`[ZEDIN] Port ${port} dolu, 10 saniye sonra tekrar denenecek...`);
            setTimeout(() => { process.exit(1); }, 10000);
        }
    });

    sunucu.listen(port, '0.0.0.0', () => {
        console.log(`[ZEDIN] Sistem ${port} üzerinde aktif!`);
    });
}

    sunucu.on('error', (hata) => {
        if (hata.code === 'EADDRINUSE') {
            console.error(`[ZEDIN] HATA: ${port} portu zaten kullanımda!`);
            console.log("[ZEDIN] 5 saniye içinde portun boşalması bekleniyor...");
            setTimeout(() => { process.exit(1); }, 5000); // 1 yerine 5 saniye ver ki port boşa düşsün
        }
    });

    sunucu.listen(port, '0.0.0.0', () => { 
        console.log(`[ZEDIN] Sistem ${port} üzerinde aktif!`); 
    });
   }
};

const getir = (dosya) => {
    const ham = fs.readFileSync(path.resolve(process.cwd(), dosya), 'utf8');
    const js = optimizasyon.hizliCeviri(ham);
    let p = {};
    const betik = new Function('fs', 'console', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'paylaş', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', 'yazdır', 'zamanla', js);
    betik(fs, console, Metin, Veri, Ag, Gorsel, getir, Sistem, fs.readFileSync, fs.writeFileSync, Date.now(), console.log, setInterval);
    return p;
};

function calistir(dosya) {
    if (!dosya) return;
    try {
        const ham = fs.readFileSync(dosya, 'utf8');
        const js = optimizasyon.hizliCeviri(ham);
        const betik = new Function('fs', 'console', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', 'yazdır', 'zamanla', js);
        betik(fs, console, Metin, {}, Ag, {}, getir, Sistem, fs.readFileSync, fs.writeFileSync, Date.now(), console.log, setInterval);
    } catch (hata) { console.error("HATA:", hata.message); }
}

calistir(process.argv[2]);

