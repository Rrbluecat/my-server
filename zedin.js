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

// --- VERİ MODÜLÜ (Hata Buradaydı) ---
const Veri = {
    oku: (dosya) => {
        try {
            const tamYol = path.resolve(process.cwd(), dosya);
            if (fs.existsSync(tamYol)) {
                const icerik = fs.readFileSync(tamYol, 'utf8');
                return JSON.parse(icerik);
            }
        } catch (e) { console.error("[VERİ] Okuma Hatası:", e.message); }
        return null;
    },
    yaz: (dosya, icerik) => {
        try {
            const tamYol = path.resolve(process.cwd(), dosya);
            fs.writeFileSync(tamYol, JSON.stringify(icerik, null, 2));
            return true;
        } catch (e) { console.error("[VERİ] Yazma Hatası:", e.message); return false; }
    }
};

const Gorsel = {
    durum: "Aktif",
    çiz: (dosya, veri = {}) => {
        try {
            let icerik = fs.readFileSync(path.resolve(process.cwd(), dosya), 'utf8');
            for (const [anahtar, deger] of Object.entries(veri)) {
                icerik = icerik.replace(new RegExp('{{' + anahtar + '}}', 'g'), deger);
            }
            return icerik;
        } catch (e) {
            console.error("[GÖRSEL] Hata:", e.message);
            return "Dosya bulunamadı: " + dosya;
        }
    }
};

let aktifSunucu = null;

const Ag = {
    sunucu_kur: (islem) => {
        aktifSunucu = http.createServer((istek, yanit) => {
            const ip = istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

            if (!koruma.hizSiniri(ip) || !koruma.sorguKontrol(istek.url)) {
                koruma.basliklariAyarla(yanit);
                yanit.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
                return yanit.end("Erisim Engellendi");
            }

            koruma.basliklariAyarla(yanit);

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
        return aktifSunucu;
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
    dinle: (p, mesaj) => {
        const port = process.env.PORT || p || 8080;
        if (aktifSunucu) {
            aktifSunucu.listen(port, '0.0.0.0', () => {
                console.log(mesaj || `--- [ZEDIN] Sistem ${port} üzerinde aktif! ---`);
            });
        }
    }
};

const getir = (dosya) => {
    try {
        const ham = fs.readFileSync(path.resolve(process.cwd(), dosya), 'utf8');
        const js = optimizasyon.hizliCeviri(ham);
        const betik = new Function('fs', 'console', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', 'yazdır', 'zamanla', js);
        return betik(fs, console, Metin, Veri, Ag, Gorsel, getir, Sistem, fs.readFileSync, fs.writeFileSync, Date.now(), console.log, setInterval);
    } catch (e) { console.error("Getir Hatası:", e.message); }
};

function calistir(dosya) {
    if (!dosya) return;
    try {
        const ham = fs.readFileSync(dosya, 'utf8');
        const js = optimizasyon.hizliCeviri(ham);
        const betik = new Function('fs', 'console', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', 'yazdır', 'zamanla', js);
        betik(fs, console, Metin, Veri, Ag, Gorsel, getir, Sistem, fs.readFileSync, fs.writeFileSync, Date.now(), console.log, setInterval);
    } catch (hata) { 
        console.error("--- ZEDINSCRIPT BETİK HATASI ---");
        console.error("Hata:", hata.message); 
    }
}

if(process.argv[2]) {
    calistir(process.argv[2]);
}

