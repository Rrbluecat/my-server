const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 8080 });

    // İnternet adresin burada görünecek
    console.log('\n--- ZEDINSCRIPT İNTERNETE AÇILDI ---');
    console.log('Adresiniz: ' + tunnel.url);
    console.log('------------------------------------\n');

    tunnel.on('close', () => {
      console.log('Tünel kapandı.');
    });
  } catch (e) {
    console.error('Tünel hatası:', e);
  }
})();


