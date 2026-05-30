const KARA_LISTE = new Set();
const ISTEK_DEPOSU = {};

const Koruma = {
    hizSiniri: (ip) => {
        if (KARA_LISTE.has(ip)) return false;

        const simdi = Date.now();
        if (!ISTEK_DEPOSU[ip]) {
            ISTEK_DEPOSU[ip] = { adet: 1, zaman: simdi, ihlal: 0 };
            return true;
        }

        // Test modu için geçici yüksek limit (İstediğinde 30'a çekersin)
        if (ISTEK_DEPOSU[ip].adet > 1000) return false;

        const fark = simdi - ISTEK_DEPOSU[ip].zaman;
        if (fark < 1000) {
            ISTEK_DEPOSU[ip].adet++;
            if (ISTEK_DEPOSU[ip].adet > 30) { 
                ISTEK_DEPOSU[ip].ihlal++;
                if (ISTEK_DEPOSU[ip].ihlal > 3) KARA_LISTE.add(ip);
                return false;
            }
        } else {
            ISTEK_DEPOSU[ip].adet = 1;
            ISTEK_DEPOSU[ip].zaman = simdi;
        }
        return true;
    },

    basliklariAyarla: (yanit) => {
        yanit.setHeader('X-Content-Type-Options', 'nosniff');
        yanit.setHeader('X-Frame-Options', 'DENY');
        yanit.setHeader('X-XSS-Protection', '1; mode=block');
        yanit.setHeader('Content-Security-Policy', "default-src 'self';");
        yanit.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    },

    sorguKontrol: (url) => {
        const tehlikeliKalıplar = [/<script/i, /UNION SELECT/i, /base64_/i, /\.\.\//];
        return !tehlikeliKalıplar.some(p => p.test(decodeURIComponent(url)));
    }
};

module.exports = Koruma;

