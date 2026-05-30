const SOZLUK = {
    'değişken': 'let', 'sabit': 'const', 'eğer': 'if', 'değilse': 'else',
    'döndür': 'return', 'görev': 'function', 'yazdır': 'console.log',
    'tekrarla': 'for', 'olduğu_sürece': 'while', 'dur': 'break',
    'devam_et': 'continue', 'dosya_oku': 'fs.readFileSync',
    'dosya_yaz': 'fs.writeFileSync', 'sistem_saati': 'Date.now()',
    'bekle': 'setTimeout', 'zamanla': 'setInterval', 'getir': 'getir', 'paylaş': 'paylaş',
    'her_biri': 'forEach', 'ekle': 'push', 'kaydet': 'yaz'
};
const anahtarKelimeler = Object.keys(SOZLUK).join('|');
const devRegex = new RegExp(`(?<![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])(${anahtarKelimeler})(?![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])`, 'g');
const Optimizasyon = {
    hizliCeviri: (hamKod) => {
        return hamKod.replace(devRegex, (match) => SOZLUK[match]);
    }
};
module.exports = Optimizasyon;
