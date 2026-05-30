const { spawn } = require('child_process');

// Yapılandırma
const AYARLAR = {
    dosya: 'zedin.js',
    betik: 'ana.zs',
    max_deneme: 5,         // Üst üste kaç kez denesin?
    hata_penceresi: 30000, // 30 saniye içinde çökerse deneme sayısını artır
    yeniden_baslat_ms: 2000 // Çökünce ne kadar beklesin?
};

let deneme_sayisi = 0;
let son_baslatma = Date.now();

function baslat() {
    const simdi = Date.now();
    
    // Eğer sistem çok hızlı çöktüyse deneme sayısını artır
    if (simdi - son_baslatma < AYARLAR.hata_penceresi) {
        deneme_sayisi++;
    } else {
        // Sistem bir süredir stabil çalışıyorsa sayacı sıfırla
        deneme_sayisi = 0;
    }

    if (deneme_sayisi >= AYARLAR.max_deneme) {
        console.error(`--- [BEKÇİ] KRİTİK HATA: Sistem ${AYARLAR.max_deneme} kez üst üste çöktü! ---`);
        console.error("--- [BEKÇİ] 1 dakika boyunca yeni deneme yapılmayacak... ---");
        setTimeout(() => {
            deneme_sayisi = 0;
            baslat();
        }, 60000); // 1 dakika ceza ver
        return;
    }

    console.log(`--- [BEKÇİ] ZedinScript Başlatılıyor (Deneme: ${deneme_sayisi + 1}) ---`);
    son_baslatma = Date.now();

    const surec = spawn('node', [AYARLAR.dosya, AYARLAR.betik], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' } 
    });

    surec.on('close', (kod) => {
        if (kod === 0) {
            console.log(`--- [BEKÇİ] Sistem temiz bir şekilde kapandı. ---`);
        } else {
            console.error(`--- [BEKÇİ] Sistem HATA ile kapandı (Kod: ${kod}). ---`);
        }
        
        setTimeout(baslat, AYARLAR.yeniden_baslat_ms);
    });

    // Bekçinin kendisi hata alırsa
    surec.on('error', (hata) => {
        console.error(`--- [BEKÇİ] Süreç başlatılamadı: ${hata.message} ---`);
    });
}

// Global hata yakalayıcı (Bekçinin kendisi ölmesin)
process.on('uncaughtException', (hata) => {
    console.error(`--- [BEKÇİ] İç Hata: ${hata.message} ---`);
});

baslat();

