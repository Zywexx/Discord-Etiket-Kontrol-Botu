Tabii, destek sunucusu ve geliştirici bilgilerini de ekleyerek tam hâlini aşağıda veriyorum:

````markdown
Discord Etiket Rol Sistemi Botu

Amaç
Kullanıcılar adlarında belirli bir etiket/tag taşıyorsa onlara otomatik olarak özel rol verir.  
Etiketi silen kullanıcılar ban listesine alınır ve tekrar etiketi ekleseler bile rol verilmez.

---

Özellikler
- Etiket kontrolü: Discord kullanıcı adı, global ad veya özel durum (status)  
- Otomatik rol verme ve geri alma  
- Etiketi silenleri ban listesine ekleme (isteğe bağlı)  
- Slash komutları ile etiket ve ban listesi yönetimi  
- Ayarlar `.env` dosyasından aktif/pasif yapılabilir

---

Ayarlar (.env)

TOKEN=BotTokeniniz
GUILD_ID=SunucuID
ROLE_ID=VerilecekRolID
ADMIN_ROLE_ID=YöneticiRolID
CHECK_USERNAME=true          # Kullanıcı adı kontrolü aktif/pasif
CHECK_GLOBAL_NAME=true       # Global ad kontrolü aktif/pasif
CHECK_CUSTOM_STATUS=true     # Özel durum kontrolü aktif/pasif
ENABLE_BAN_SYSTEM=true       # Ban sistemi aktif/pasif
CLIENT_ID=BotClientID        # Slash komut yüklemek için
````

---

## Gereken Dosyalar

* `tags.json` → Etiket listesi örneği:

  ```json
  ["tag1", "ZYWEX"]
  ```
* `banlist.json` → Banlanan kullanıcıların ID listesi örneği:

  ```json
  ["10410938473"]
  ```

---

## Nasıl Çalıştırılır?

1. [Node.js](https://nodejs.org) kurulu olmalı
2. Terminalde bot klasörüne girin:

   ```
   cd bot_klasörü
   ```
3. Gerekli paketleri yükleyin:

   ```
   npm install discord.js dotenv
   ```
4. `.env` dosyasını düzenleyin
5. Botu başlatın:

   ```
   node main.js
   ```

---

## Slash Komutları

* `/etiket-ekle <etiket>` → Etiket ekle
* `/etiket-kaldır <etiket>` → Etiket kaldır
* `/etiketler` → Kayıtlı etiketleri göster
* `/liste` → Etiket taşıyan/taşımayan kullanıcı sayıları ve son ekleyenler
* `/ban-list-ekle <kullanıcı>` → Ban listesine kullanıcı ekle
* `/ban-list-kaldır <kullanıcı>` → Ban listesinden kullanıcı çıkar

---

## Otomatik İşleyiş

* Kullanıcı adı, global ad veya özel durumda etiket varsa rol verilir
* Etiketi silerse rol alınır ve (aktifse) ban listesine eklenir
* Ban listesinde olanlara tekrar rol verilmez
* Profil değişiklikleri anlık kontrol edilir ve rol durumu güncellenir

---

## Destek & İletişim

💬 Destek Sunucusu: [https://discord.gg/YAEjW6drVY](https://discord.gg/YAEjW6drVY)

👤 Geliştirici: Zywexx

✉️ Sorularınız için DM atabilirsiniz!

---

## Lisans

Bu proje [GNU Genel Kamu Lisansı v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.tr.html) altında lisanslanmıştır.  
Yazılımı özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz; ancak aynı lisans şartlarına uymanız gerekir.  
Detaylar için lisans dosyasını inceleyebilirsiniz.

