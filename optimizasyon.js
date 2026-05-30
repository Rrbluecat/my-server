// ~/ZedinScript $ cat optimizasyon.js
const SOZLUK = {
    'değişken': 'let', 'sabit': 'const', 'eğer': 'if', 'değilse': 'else',
    'döndür': 'return', 'görev': 'function', 'yazdır': 'console.log',
    'tekrarla': 'for', 'olduğu_sürece': 'while', 'dur': 'break',
    'devam_et': 'continue', 'dosya_oku': 'fs.readFileSync',
    'dosya_yaz': 'fs.writeFileSync', 'sistem_saati': 'Date.now()',
    'bekle': 'setTimeout', 'zamanla': 'setInterval', 'getir': 'getir', 'paylaş': 'paylaş'
};

// Regex'i bir kez oluşturup önbelleğe alıyoruz (Hızın anahtarı burası)
const anahtarKelimeler = Object.keys(SOZLUK).join('|');
const devRegex = new RegExp(`(?<![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])(${anahtarKelimeler})(?![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])`, 'g');

const Optimizasyon = {
    hizliCeviri: (hamKod) => {
        // Tek bir replace işlemiyle tüm sözlüğü değiştiriyoruz
        return hamKod.replace(devRegex, (match) => SOZLUK[match]);
    }
};

module.exports = Optimizasyon;

