const { spawn } = require('child_process');

function baslat() {
    console.log("--- [BEKÇİ] ZedinScript Başlatılıyor... ---");
    
    // zedin.js'yi ana.zs parametresiyle çalıştır
    const surec = spawn('node', ['zedin.js', 'ana.zs'], { stdio: 'inherit' });

    surec.on('close', (kod) => {
        console.log(`--- [BEKÇİ] Sistem ${kod} koduyla kapandı. Yeniden başlatılıyor... ---`);
        // Kısa bir bekleme ve tekrar başlat
        setTimeout(baslat, 1000);
    });
}

baslat();

