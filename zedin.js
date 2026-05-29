const fs = require('fs');
const path = require('path');
const http = require('http');

// --- GÜVENLİK SİSTEMLERİ (DOS/FLOOD KORUMASI) ---
const ISTEK_KAYITLARI = {}; 
const TEMIZLIK_ARALIGI = 60000; // 1 dakika

// Eski IP kayıtlarını periyodik temizle
setInterval(() => {
    const simdi = Date.now();
    for (let ip in ISTEK_KAYITLARI) {
        if (simdi - ISTEK_KAYITLARI[ip].zaman > TEMIZLIK_ARALIGI) delete ISTEK_KAYITLARI[ip];
    }
}, TEMIZLIK_ARALIGI);

const SOZLUK = {
    'değişken': 'let', 'sabit': 'const', 'eğer': 'if', 'değilse': 'else',
    'döndür': 'return', 'görev': 'function', 'yazdır': 'console.log',
    'tekrarla': 'for', 'olduğu_sürece': 'while', 'dur': 'break',
    'devam_et': 'continue', 'dosya_oku': 'fs.readFileSync',
    'dosya_yaz': 'fs.writeFileSync', 'sistem_saati': 'Date.now()',
    'bekle': 'setTimeout', 'zamanla': 'setInterval', 'getir': 'getir', 'paylaş': 'paylaş'
};

function ceviriYap(hamKod) {
    let islenmiş = hamKod;
    Object.keys(SOZLUK).forEach(anahtar => {
        const regex = new RegExp(`(?<![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])${anahtar}(?![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])`, 'g');
        islenmiş = islenmiş.replace(regex, SOZLUK[anahtar]);
    });
    return islenmiş;
}

const TIPLER = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.zs': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json'
};

const Matematik = {
    kök_al: Math.sqrt,
    rastgele: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pi: Math.PI
};

const Metin = {
    büyük_harf: (m) => m.toUpperCase(),
    uzunluk: (m) => m.length,
    içeriyor_mu: (m, p) => m.includes(p),
    temizle: (m) => {
        if(typeof m !== 'string') return m;
        return m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
};

const Sistem = {
    log_yaz: (mesaj) => {
        const log = `[${new Date().toLocaleString()}] ${mesaj}\n`;
        fs.appendFile('sunucu.log', log, () => {}); // Senkron değil asenkron yaparak hızı artırdık
    },
    bellek_kullanımı: () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    yeniden_başlat: () => { console.log("ZedinScript: Yeniden başlatılıyor..."); process.exit(0); }
};

const Veri = {
    kaydet: (dosya, icerik) => fs.writeFileSync(dosya, JSON.stringify(icerik, null, 2), 'utf8'),
    oku: (dosya) => { try { return JSON.parse(fs.readFileSync(dosya, 'utf8')); } catch(e) { return null; } }
};

const Gorsel = {
    çiz: (dosya, veriler) => {
        if (!fs.existsSync(dosya)) return "Şablon bulunamadı.";
        let icerik = fs.readFileSync(dosya, 'utf8');
        if (veriler) {
            Object.keys(veriler).forEach(anahtar => {
                icerik = icerik.replace(new RegExp(`{{${anahtar}}}`, 'g'), veriler[anahtar]);
            });
        }
        return icerik;
    }
};

const Ag = {
    sunucu_kur: (islem) => {
        return http.createServer((istek, yanit) => {
            const ip = istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;
            const simdi = Date.now();

            // --- RATE LIMITER (İSTEK SINIRLAYICI) ---
            if (!ISTEK_KAYITLARI[ip]) ISTEK_KAYITLARI[ip] = { adet: 0, zaman: simdi };
            if (simdi - ISTEK_KAYITLARI[ip].zaman < 1000) {
                ISTEK_KAYITLARI[ip].adet++;
                if (ISTEK_KAYITLARI[ip].adet > 15) { // Saniyede 15+ istek atan engellenir
                    yanit.writeHead(429, {'Content-Type': 'text/plain'});
                    return yanit.end("Güvenlik: Çok fazla istek gönderildi!");
                }
            } else {
                ISTEK_KAYITLARI[ip] = { adet: 1, zaman: simdi };
            }

            // --- GÜVENLİK HEADERS (A+ SEVİYESİ) ---
            yanit.setHeader('X-Content-Type-Options', 'nosniff');
            yanit.setHeader('X-Frame-Options', 'DENY');
            yanit.setHeader('X-XSS-Protection', '1; mode=block');
            yanit.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            yanit.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            yanit.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");

            if (istek.url === '/favicon.ico') { yanit.writeHead(204); return yanit.end(); }

            yanit.gönder = (mesaj, stat = 200) => {
                yanit.writeHead(stat, {'Content-Type': 'text/html; charset=utf-8'});
                yanit.end(mesaj);
            };
            yanit.json_gönder = (veri) => {
                yanit.writeHead(200, {'Content-Type': 'application/json'});
                yanit.end(JSON.stringify(veri));
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
                // Secure bayrağı Railway (HTTPS) için önemlidir
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
        istek.on('data', p => { if(govde.length < 500000) govde += p; }); // 500KB Sınırı (DoS Koruması)
        istek.on('end', () => { geri_donus(Object.fromEntries(new URLSearchParams(govde))); });
    },
    dinle: (sunucu, kapi, mesaj) => {
        const port = process.env.PORT || kapi || 8080;
        sunucu.timeout = 10000; // 10 saniye boşta duran bağlantıyı kapat (Slowloris Koruması)
        sunucu.listen(port, '0.0.0.0', () => { console.log(mesaj || `${port} aktif!`); });
    }
};

const getir = (dosya) => {
    const js = ceviriYap(fs.readFileSync(path.resolve(process.cwd(), dosya), 'utf8'));
    let p = {};
    const betik = new Function('fs', 'console', 'matematik', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'paylaş', 'setInterval', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', js);
    betik(fs, console, Matematik, Metin, Veri, Ag, Gorsel, getir, p, setInterval, Sistem, fs.readFileSync, fs.writeFileSync, Date.now());
    return p;
};

function calistir(dosya) {
    if (!dosya) return;
    try {
        const js = ceviriYap(fs.readFileSync(dosya, 'utf8'));
        const betik = new Function('fs', 'console', 'matematik', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'setInterval', 'sistem', 'dosya_oku', 'dosya_yaz', 'sistem_saati', js);
        betik(fs, console, Matematik, Metin, Veri, Ag, Gorsel, getir, setInterval, Sistem, fs.readFileSync, fs.writeFileSync, Date.now());
    } catch (hata) { console.error("HATA:", hata.message); }
}

calistir(process.argv[2]);

