const { spawn } = require('child_process');

// Yapılandırma
const AYARLAR = {
    dosya: 'zedin.js',
    betik: 'ana.zs',
    max_deneme: 5,
    hata_penceresi: 60000,
    yeniden_baslat_ms: 10000 // 10 saniye bekle ki liman boşalsın
};

let deneme_sayisi = 0;
let son_baslatma = Date.now();

function baslat() {
    const simdi = Date.now();
    
    if (simdi - son_baslatma < AYARLAR.hata_penceresi) {
        deneme_sayisi++;
    } else {
        deneme_sayisi = 0;
    }

    if (deneme_sayisi >= AYARLAR.max_deneme) {
        console.error(`--- [BEKÇİ] KRİTİK: Sistem üst üste çöktü. 1 dk mola... ---`);
        setTimeout(() => {
            deneme_sayisi = 0;
            baslat();
        }, 60000);
        return;
    }

    console.log(`--- [BEKÇİ] ZedinScript Başlatılıyor (Deneme: ${deneme_sayisi + 1}) ---`);
    son_baslatma = Date.now();

    const surec = spawn('node', [AYARLAR.dosya, AYARLAR.betik], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' } 
    });

    surec.on('close', (kod) => {
        console.log(`--- [BEKÇİ] Sistem kapandı (Kod: ${kod}). ${AYARLAR.yeniden_baslat_ms/1000} sn sonra restart... ---`);
        setTimeout(baslat, AYARLAR.yeniden_baslat_ms);
    });

    surec.on('error', (hata) => {
        console.error(`--- [BEKÇİ] Hata: ${hata.message} ---`);
    });
}

// Global hata yakalayıcı
process.on('uncaughtException', (hata) => {
    console.error(`--- [BEKÇİ] İç Hata: ${hata.message} ---`);
});

baslat();

