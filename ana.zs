yazdır("--- ZEDINSCRIPT SİSTEM MERKEZİ GÜVENLİ (.ZS) ---");

sabit SİSTEM_ŞİFRESİ = "zedin123"; // Railway'de bunu 'Environment Variable' yapmak daha iyidir

zamanla(görev() {
    sistem.log_yaz("Güvenlik Kontrolü: Sistem Stabil. Bellek: " + sistem.bellek_kullanımı());
}, 600000);

değişken sunucu = ağ.sunucu_kur(görev(istek, yanıt) {
    değişken çerezler = ağ.çerez_oku(istek);
    değişken giriş_yapılmış_mı = (çerezler.oturum == "dogrulandi");

    // 1. STATİK DOSYALAR
    eğer (istek.url == "/stil.css") { yanıt.dosya_gönder("stil.css"); döndür; }
    değilse eğer (istek.url == "/logo.png")
    { yanıt.dosya_gönder("logo.png");
    döndür; }
    
    // 2. ANA SAYFA
    değilse eğer (istek.url == "/") {
        değişken kullanıcı = veri.oku("veritabani.json") || {ad: "Bilinmiyor", seviye: 0};
    değişken link_verisi = veri.oku("linkler.json") || [];
    değişken link_html = "";
    link_verisi.her_biri(görev(l) {
    link_html += "<li><a href='" + l.url + "'>" + l.ad + "</a></li>";
    });

    yanıt.gönder(görsel.çiz("arayüz.html", 
    {	   
        kullanıcı_adı:
    metin.temizle(kullanıcı.ad),
	seviye:
    metin.temizle(kullanıcı.seviye),
        linkler: link_html, // Burayı
    ekledik
	zaman: sistem_saati
    }));
    }

    // 3. GİRİŞ SAYFASI
    değilse eğer (istek.url == "/giris") {
        yanıt.gönder(görsel.çiz("giris.html"));
    }

    // 4. OTURUM AÇMA
    değilse eğer (istek.url == "/oturum_ac" && istek.method == "POST") {
        ağ.post_yakala(istek, görev(veri) {
            eğer (veri.sifre == SİSTEM_ŞİFRESİ) {
                yanıt.çerez_ayarla("oturum", "dogrulandi");
                yanıt.yönlendir("/admin");
            } değilse {
                yanıt.gönder("Giriş Reddedildi!");
            }
        });
    }

    // 5. ADMIN PANELİ
    değilse eğer (istek.url == "/admin") {
        eğer (giriş_yapılmış_mı) {
            yanıt.gönder(görsel.çiz("admin.html", {
                bellek: sistem.bellek_kullanımı(),
                zaman: sistem_saati
            }));
        } değilse { yanıt.yönlendir("/giris"); }
    }

    // 6. UZAKTAN LOG İZLEME
    değilse eğer (istek.url == "/admin/loglar") {
        eğer (giriş_yapılmış_mı) {
            yanıt.gönder("<pre>" + metin.temizle(dosya_oku("sunucu.log", "utf8")) + "</pre>");
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    // 7. KOD EDİTÖRÜ
    değilse eğer (istek.url == "/admin/editor") {
        eğer (giriş_yapılmış_mı) {
            yanıt.gönder(görsel.çiz("editor.html", { kod: metin.temizle(dosya_oku("ana.zs", "utf8")) }));
        } değilse { yanıt.yönlendir("/giris"); }
    }

    // 8. KAYDET (Kritik Alan!)
    değilse eğer (istek.url == "/kaydet" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                // Kod editörü olduğu için temizlemiyoruz (yoksa kod bozulur), 
                // ama sadece yetkili kişi erişebiliyor.
                dosya_yaz("ana.zs", gelen.yeni_kod);
                sistem.log_yaz("UYARI: Kod uzaktan değiştirildi.");
                yanıt.gönder("Sistem güncellendi. Yeniden başlatılıyor...");
                sistem.yeniden_başlat();
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    // 9. VERİ GÜNCELLEME (Girdi Temizliği Burası!)
    değilse eğer (istek.url == "/guncelle" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                // Veritabanına yazmadan önce veriyi süzüyoruz
                değişken temiz_ad = metin.temizle(gelen.yeni_ad);
                değişken temiz_seviye = metin.temizle(gelen.yeni_seviye);
                
                veri.kaydet("veritabani.json", { ad: temiz_ad, seviye: temiz_seviye });
                yanıt.yönlendir("/");
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    // 10. LİNK EKLEME
    değilse eğer (istek.url == "/link_ekle"
    && istek.method == "POST") {
        ağ.post_yakala(istek, görev(gelen)
    {
	    değişken linkler =
    veri.oku("linkler.json") || [];
	    değişken yeni_link = { 
	        ad:
    metin.temizle(gelen.link_ad), 
	        url:
    metin.temizle(gelen.link_url) 
            };
	    linkler.ekle(yeni_link);
	    veri.kaydet("linkler.json",
    linkler);
            yanıt.yönlendir("/");
        });
    }

    değilse { yanıt.gönder("404", 404); }
});

ağ.dinle(sunucu, 8080);

