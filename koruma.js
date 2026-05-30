// ~/ZedinScript $ cat koruma.js
const ISTEK_DEPOSU = {};

const Koruma = {
    // 1. IP Tabanlı Hız Sınırı (Flood/DoS Koruması)
    hizSiniri: (ip) => {
        const simdi = Date.now();
        if (!ISTEK_DEPOSU[ip]) {
            ISTEK_DEPOSU[ip] = { adet: 1, zaman: simdi };
            return true;
        }

        const fark = simdi - ISTEK_DEPOSU[ip].zaman;
        if (fark < 1000) { // 1 saniye içinde
            ISTEK_DEPOSU[ip].adet++;
            if (ISTEK_DEPOSU[ip].adet > 15) return false; // Saniyede 15+ istek atan engellenir
        } else {
            ISTEK_DEPOSU[ip] = { adet: 1, zaman: simdi };
        }
        return true;
    },

    // 2. A+ Güvenlik Başlıklarını Basar (Header Shield)
    basliklariAyarla: (yanit) => {
        yanit.setHeader('X-Content-Type-Options', 'nosniff');
        yanit.setHeader('X-Frame-Options', 'DENY');
        yanit.setHeader('X-XSS-Protection', '1; mode=block');
        yanit.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        yanit.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        yanit.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
        yanit.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    },

    // 3. Zararlı Karakter Filtresi (Path Traversal Koruması)
    yolGuvenliMi: (yol) => {
        // ../ gibi dizin üstüne çıkma çabalarını engeller
        return !yol.includes('..');
    }
};

module.exports = Koruma;

