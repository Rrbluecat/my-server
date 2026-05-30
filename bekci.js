#!/usr/bin/env node
const { spawn } = require('child_process');

console.log("--- [BEKÇİ] 5 saniye soğutma bekleniyor... ---");
setTimeout(baslat, 5000); // Hemen başlama, bir dur ortalık sakinleşsin.

// bekci.js içindeki baslat fonksiyonunun başı
function baslat() {
    console.log("--- [BEKÇİ] Liman kontrol ediliyor... ---");
    // Önceki denemeden kalan bir node süreci varsa Railway'in temizlemesi için zaman tanı
    setTimeout(() => {
        // ... süreç başlatma kodları ...
    }, 2000);
}

// Yapılandırma
const AYARLAR = {
    dosya: 'zedin.js',
    betik: 'ana.zs',
    max_deneme: 3,          // Deneme sayısını azalt ama süreyi uzat
    hata_penceresi: 120000, // 2 dakikalık pencere
    yeniden_baslat_ms: 15000 // Çökme sonrası 15 saniye bekle (Kritik!)
};

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

