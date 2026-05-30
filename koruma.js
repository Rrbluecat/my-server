const ISTEK_DEPOSU = new Map();
const Koruma = {
    hizSiniri: (ip) => {
        const simdi = Date.now();
        if (!ISTEK_DEPOSU.has(ip)) {
            ISTEK_DEPOSU.set(ip, { adet: 1, zaman: simdi });
            return true;
        }
        const kayit = ISTEK_DEPOSU.get(ip);
        if (simdi - kayit.zaman > 1000) {
            ISTEK_DEPOSU.set(ip, { adet: 1, zaman: simdi });
            return true;
        }
        kayit.adet++;
        return kayit.adet <= 20;
    },
    basliklariAyarla: (yanit) => {
        yanit.setHeader('X-Content-Type-Options', 'nosniff');
        yanit.setHeader('X-Frame-Options', 'DENY');
    },
    sorguKontrol: (url) => {
        return !/<script|UNION SELECT|\.\.\//i.test(decodeURIComponent(url));
    }
};
// Saatte bir temizlik
setInterval(() => {
    const sinir = Date.now() - 60000;
    for (const [ip, kayit] of ISTEK_DEPOSU) {
        if (kayit.zaman < sinir) ISTEK_DEPOSU.delete(ip);
    }
}, 60000);
module.exports = Koruma;
