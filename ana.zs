yazdır("--- ZEDINSCRIPT SİSTEM MERKEZİ AKTİF (.ZS) ---");

sabit SİSTEM_ŞİFRESİ = "zedin123";

// --- OTOMATİK SİSTEM GÜNLÜĞÜ ---
zamanla(görev() {
    sistem.log_yaz("Bellek Durumu: " + sistem.bellek_kullanımı());
}, 600000);

değişken sunucu = ağ.sunucu_kur(görev(istek, yanıt) {
    değişken çerezler = ağ.çerez_oku(istek);
    değişken giriş_yapılmış_mı = (çerezler.oturum == "dogrulandi");

    // 1. STATİK DOSYALAR
    eğer (istek.url == "/stil.css") { yanıt.dosya_gönder("stil.css"); döndür; }

    // 2. ANA SAYFA
    değilse eğer (istek.url == "/") {
        değişken kullanıcı = veri.oku("veritabani.json");
        yanıt.gönder(görsel.çiz("arayüz.html", {
            kullanıcı_adı: kullanıcı.ad,
            seviye: kullanıcı.seviye,
            zaman: sistem_saati
        }));
    }

    // 3. GİRİŞ SAYFASI
    değilse eğer (istek.url == "/giris") {
        yanıt.gönder(görsel.çiz("giris.html"));
    }

    // 4. OTURUM AÇMA (POST)
    değilse eğer (istek.url == "/oturum_ac" && istek.method == "POST") {
        ağ.post_yakala(istek, görev(veri) {
            eğer (veri.sifre == SİSTEM_ŞİFRESİ) {
                yanıt.çerez_ayarla("oturum", "dogrulandi");
                yanıt.yönlendir("/admin");
            } değilse {
                yanıt.gönder("Hatalı Şifre!");
            }
        });
    }

    // 5. GELİŞMİŞ ADMIN PANELİ
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
            yanıt.gönder("<pre>" + dosya_oku("sunucu.log") + "</pre>");
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    // 7. CANLI KOD EDİTÖRÜ (Self-Host Gücü)
    değilse eğer (istek.url == "/admin/editor") {
        eğer (giriş_yapılmış_mı) {
            değişken mevcut_kod = dosya_oku("ana.zs", "utf8");
            yanıt.gönder(görsel.çiz("editor.html", { kod: mevcut_kod }));
        } değilse { yanıt.yönlendir("/giris"); }
    }

    // 8. KODU KAYDET VE YENİDEN BAŞLAT
    değilse eğer (istek.url == "/kaydet" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                dosya_yaz("ana.zs", gelen.yeni_kod);
                sistem.log_yaz("Kod uzaktan güncellendi.");
                yanıt.gönder("<h2>Kod Kaydedildi!</h2><p>Sistem yeniden başlatılıyor...</p><script>setTimeout(()=>location.href='/admin', 3000)</script>");
                sistem.yeniden_başlat();
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    // 9. TEST YOLU
    değilse eğer (istek.url == "/test_sistem") {
        yanıt.json_gönder({
            mesaj: "ZedinScript Canlı!",
            bellek: sistem.bellek_kullanımı(),
            zaman: sistem_saati
        });
    }

    // 10. VERİ GÜNCELLEME
    değilse eğer (istek.url == "/guncelle" && istek.method == "POST") {
        eğer (giriş_yapılmış_mı) {
            ağ.post_yakala(istek, görev(gelen) {
                veri.kaydet("veritabani.json", { ad: gelen.yeni_ad, seviye: gelen.yeni_seviye });
                yanıt.yönlendir("/");
            });
        } değilse { yanıt.gönder("Yetki yok!", 403); }
    }

    değilse { yanıt.gönder("404 Bulunamadı", 404); }
});

ağ.dinle(sunucu, 8080, "ZedinScript Dinliyor: http://localhost:8080");

