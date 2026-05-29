const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// --- ZEDINSCRIPT SÖZLÜK ---
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

const TIPLER = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };

// --- STANDART KÜTÜPHANELER ---
const Matematik = { kök_al: Math.sqrt, rastgele: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min, pi: Math.PI };
const Metin = { büyük_harf: (m) => m.toUpperCase(), uzunluk: (m) => m.length, içeriyor_mu: (m, p) => m.includes(p) };

// Geliştirilmiş Sistem Kontrolü
const Sistem = {
    log_yaz: (mesaj) => {
        const log = `[${new Date().toLocaleString()}] ${mesaj}\n`;
        fs.appendFileSync('sunucu.log', log);
    },
    bellek_kullanımı: () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    yeniden_başlat: () => {
        console.log("Sistem yeniden başlatılıyor...");
        process.exit(0); // Watchdog (bekçi) bunu yakalayıp tekrar açacak
    }
};

const Veri = {
    kaydet: (dosya, icerik) => {
        fs.writeFile(dosya, JSON.stringify(icerik, null, 2), 'utf8', () => {});
    },
    oku: (dosya) => {
        try { return JSON.parse(fs.readFileSync(dosya, 'utf8')); } catch(e) { return null; }
    }
};

const Gorsel = {
    çiz: (dosya, veriler) => {
        if (!fs.existsSync(dosya)) return "Şablon yok: " + dosya;
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
                const tamYol = path.join(process.cwd(), yol);
                if (fs.existsSync(tamYol)) {
                    const uzanti = path.extname(tamYol);
                    yanit.writeHead(200, {'Content-Type': TIPLER[uzanti] || 'text/plain'});
                    fs.createReadStream(tamYol).pipe(yanit);
                } else { yanit.writeHead(404); yanit.end("Dosya bulunamadı."); }
            };
            yanit.yönlendir = (yol) => { yanit.writeHead(302, {'Location': yol}); yanit.end(); };
            yanit.çerez_ayarla = (isim, deger) => {
                yanit.setHeader('Set-Cookie', `${isim}=${deger}; Path=/; HttpOnly; Max-Age=3600`);
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
        istek.on('data', p => { govde += p; });
        istek.on('end', () => { geri_donus(Object.fromEntries(new URLSearchParams(govde))); });
    },
    dinle: (sunucu, kapi, mesaj) => { 
        sunucu.listen(kapi, '0.0.0.0', () => { console.log(mesaj || kapi + " dinleniyor..."); }); 
    }
};

const getir = (dosya) => {
    const js = ceviriYap(fs.readFileSync(path.resolve(process.cwd(), dosya), 'utf8'));
    let p = {};
    const betik = new Function('fs', 'console', 'matematik', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'paylaş', 'setInterval', 'sistem', 'dosya_oku', 'dosya_yaz', js);
    betik(fs, console, Matematik, Metin, Veri, Ag, Gorsel, getir, p, setInterval, Sistem, fs.readFileSync, fs.writeFileSync);
    return p;
};

function motor(dosya) {
    if (!dosya) return;
    try {
        const js = ceviriYap(fs.readFileSync(dosya, 'utf8'));
        const betik = new Function('fs', 'console', 'matematik', 'metin', 'veri', 'ağ', 'görsel', 'getir', 'setInterval', 'sistem', 'dosya_oku', 'dosya_yaz', js);
        betik(fs, console, Matematik, Metin, Veri, Ag, Gorsel, getir, setInterval, Sistem, fs.readFileSync, fs.writeFileSync);
    } catch (hata) { console.error("HATA:", hata.message); }
}

motor(process.argv[2]);

