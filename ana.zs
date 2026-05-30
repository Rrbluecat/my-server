yazdır("--- ZEDINSCRIPT SİSTEM MERKEZİ GÜVENLİ (.ZS) ---");
sabit SİSTEM_ŞİFRESİ = "zedin123";
zamanla(görev() {
    sistem.log_yaz("Güvenlik Kontrolü: Sistem Stabil. Bellek: " + sistem.bellek_kullanımı());
}, 600000);
değişken sunucu = ağ.sunucu_kur(görev(istek, yanıt) {
    değişken çerezler = ağ.çerez_oku(istek);
    değişken giriş_yapılmış_mı = (çerezler.oturum == "dogrulandi");
    eğer (istek.url == "/stil.css") { yanıt.dosya_gönder("stil.css"); döndür; }
    değilse eğer (istek.url == "/logo.png" || istek.url == "/zedin_logo.png") { yanıt.dosya_gönder("zedin_logo.png"); döndür; }
    değilse eğer (istek.url == "/favicon.ico") { yanıt.dosya_gönder("zedin_logo.png"); döndür; }
    değilse eğer (istek.url == "/") {
        değişken kullanıcı = veri.oku("veritabani.json") || {ad: "Bilinmiyor", seviye: 0};
        değişken link_verisi = veri.oku("linkler.json") || [];
        değişken link_html = "";
        link_verisi.her_biri(görev(l) {
            link_html += "<li><a href='" + l.url + "'>" + l.ad + "</a></li>";
        });
        yanıt.gönder(görsel.çiz("arayüz.html", {
            kullanıcı_adı: metin.temizle(kullanıcı.ad),
            seviye: metin.temizle(kullanıcı.seviye),
            linkler: link_html,
            saat: sistem_saati
        }));
    }
    değilse eğer (istek.url == "/giris") { yanıt.gönder(görsel.çiz("giris.html")); }
    değilse eğer (istek.url == "/oturum_ac" && istek.method == "POST") {
        ağ.post_yakala(istek, görev(veri) {
            eğer (veri.sifre == SİSTEM_ŞİFRESİ) {
                yanıt.çerez_ayarla("oturum", "dogrulandi");
                yanıt.yönlendir("/admin");
            } değilse { yanıt.gönder("Giriş Reddedildi!"); }
        });
    }
    değilse eğer (istek.url == "/admin") {
        eğer (giriş_yapılmış_mı) {
            yanıt.gönder(görsel.çiz("admin.html", { bellek: sistem.bellek_kullanımı(), zaman: sistem_saati }));
        } değilse { yanıt.yönlendir("/giris"); }
    }
    değilse eğer (istek.url == "/admin/loglar") {
        eğer (giriş_yapılmış_mı) { yanıt.gönder("<pre>" + metin.temizle(dosya_oku("sunucu.log", "utf8")) + "</pre>"); }
        değilse { yanıt.gönder("Yetki yok!", 403); }
    }
    değilse eğer (istek.url == "/admin/editor") {
        eğer (giriş_yapılmış_mı) { yanıt.gönder(görsel.çiz("editor.html", { kod: metin.temizle(dosya_oku("ana.zs", "utf8")) })); }
        değilse { yanıt.yönlendir("/giris"); }
    }
    değilse eğer (istek.url == "/save-kod" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                dosya_yaz("ana.zs", gelen.yeni_kod);
                sistem.log_yaz("UYARI: Kod uzaktan değiştirildi.");
                yanıt.gönder("Sistem güncellendi. Yeniden başlatılıyor...");
                sistem.yeniden_başlat();
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }
    değilse eğer (istek.url == "/guncelle" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                veri.kaydet("veritabani.json", { ad: metin.temizle(gelen.yeni_ad), seviye: metin.temizle(gelen.yeni_seviye) });
                yanıt.yönlendir("/");
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }
    değilse eğer (istek.url == "/add-link" && istek.method == "POST") {
        ağ.post_yakala(istek, görev(gelen) {
            değişken linkler = veri.oku("linkler.json") || [];
            linkler.ekle({ ad: metin.temizle(gelen.l_ad), url: metin.temizle(gelen.l_url) });
            veri.kaydet("linkler.json", linkler);
            yanıt.yönlendir("/");
        });
    }
    değilse { yanıt.gönder("404", 404); }
});
ağ.dinle(8080);
