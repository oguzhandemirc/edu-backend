# İngilizce Test Uygulaması API

Bu proje, İngilizce test uygulaması için bir backend API'sıdır.

## Teknoloji Yığını

- **Backend**: Express.js
- **Veritabanı**: MySQL
- **ORM**: Prisma
- **Kimlik Doğrulama**: JWT (JSON Web Token)
- **Validasyon**: Zod
- **API Dökümantasyonu**: Swagger

## Özellikler

- **Bölümler**: Okuduğunu anlama, çeviri, cümle tamamlama gibi kategoriler
- **Testler**: Her bölüm içinde zorluk seviyelerine göre sınıflandırılmış testler, süre sınırlı
- **Sorular**: Her teste ait çoktan seçmeli sorular (en az 2 şık ve 1 doğru cevap)
- **Kullanıcı İlerlemesi**: Kullanıcıların test sonuçlarının kaydedilmesi ve performans analizi
  - Test başlama zamanı ve geçen süre kaydı
  - Her test için doğru/yanlış sayısı ve puan hesaplama
  - Zorluk seviyelerine göre performans analizi
  - Bir testi farklı zamanlarda çözüp gelişim takibi yapabilme
- **Güvenli Test Çözme**: Doğru cevaplar gizlenerek kullanıcıya gönderilir
- **Admin Yönetimi**: Yetkilendirilmiş kullanıcılar için bölüm, test ve soru yönetimi

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone <repo-url>
   cd edu
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. MySQL veritabanını hazırlayın:
   - MAMP veya benzeri bir araç ile MySQL sunucusunu çalıştırın (Varsayılan port: 8889)
   - `.env` dosyasındaki `DATABASE_URL` değişkenini kontrol edin/güncelleyin

4. Prisma migrasyonlarını çalıştırın:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## API Dökümantasyonu

API dökümantasyonuna aşağıdaki adresten erişebilirsiniz:

```
http://localhost:3000/api-docs
```

## Mevcut Endpoint'ler

- **Kimlik Doğrulama**
  - `POST /api/auth/register` - Yeni kullanıcı kaydı
  - `POST /api/auth/login` - Kullanıcı girişi
  - `GET /api/auth/validate-token` - Token doğrulama ve kullanıcı bilgilerini getirme
  - `GET /api/auth/verify-role` - Kullanıcının admin rolüne sahip olup olmadığını kontrol etme

- **Bölümler**
  - `GET /api/sections` - Tüm bölümleri listele
  - `GET /api/sections/:id` - Belirli bir bölümü getir
  - `POST /api/sections` - Yeni bölüm oluştur (admin)
  - `PUT /api/sections/:id` - Bölümü güncelle (admin)
  - `DELETE /api/sections/:id` - Bölümü sil (admin)

- **Testler**
  - `GET /api/tests` - Tüm testleri listele
  - `GET /api/tests/difficulty-levels` - Test zorluk seviyelerini listele
  - `GET /api/tests/section/:sectionId` - Bir bölüme ait testleri listele
  - `GET /api/tests/:id` - Belirli bir testi getir
  - `POST /api/tests` - Yeni test oluştur (admin)
  - `PUT /api/tests/:id` - Testi güncelle (admin)
  - `DELETE /api/tests/:id` - Testi sil (admin)

- **Sorular (Çoktan Seçmeli)**
  - `GET /api/questions/test/:testId` - Bir teste ait soruları listele
  - `GET /api/questions/test/:testId/for-users` - Bir teste ait soruları doğru cevaplar olmadan listele (Kullanıcılar için)
  - `GET /api/questions/:id` - Belirli bir soruyu getir
  - `POST /api/questions` - Yeni soru oluştur (admin)
  - `PUT /api/questions/:id` - Soruyu güncelle (admin)
  - `DELETE /api/questions/:id` - Soruyu sil (admin)

- **Test Sonuçları**
  - `POST /api/test-results/start` - Test çözmeye başla (başlama zamanını kaydet)
  - `GET /api/test-results/questions/:testId` - Doğru cevaplar gizlenmiş test sorularını getir
  - `POST /api/test-results` - Test sonucunu kaydet
  - `GET /api/test-results` - Kullanıcının tüm test sonuçlarını getir
  - `GET /api/test-results/performance` - Kullanıcının performans analizini getir
  - `GET /api/test-results/compare-with-peers` - Kullanıcının performansını akranlarıyla karşılaştır
  - `GET /api/test-results/test/:testId` - Kullanıcının belirli bir teste ait sonuçlarını getir
  - `GET /api/test-results/:id` - Belirli bir test sonucunu detaylı olarak getir

## Çoktan Seçmeli Soru Ekleme Örneği

```json
{
  "content": "İngilizce'de 'book' kelimesinin Türkçe karşılığı nedir?",
  "explanation": "Book kelimesi, Türkçe'de kitap anlamına gelir.",
  "testId": 1,
  "options": [
    {
      "content": "Kalem",
      "isCorrect": false
    },
    {
      "content": "Kitap",
      "isCorrect": true
    },
    {
      "content": "Defter",
      "isCorrect": false
    },
    {
      "content": "Silgi",
      "isCorrect": false
    }
  ]
}
```

## Test Oluşturma Örneği

```json
{
  "title": "Temel İngilizce Kelimeler Testi",
  "description": "Günlük hayatta kullanılan temel İngilizce kelimelerin Türkçe karşılıklarını bulma testi",
  "difficulty": "BEGINNER",
  "duration": 45,
  "sectionId": 1
}
```

## Test Başlatma Örneği

```json
{
  "testId": 1
}
```

## Test Sonucu Kaydetme Örneği

```json
{
  "testId": 1,
  "testSessionId": 123,
  "correctCount": 8,
  "wrongCount": 2,
  "totalQuestions": 10,
  "score": 80,
  "duration": 600,
  "startedAt": "2023-04-22T10:35:25Z",
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 2,
      "isCorrect": true
    },
    {
      "questionId": 2,
      "selectedOptionId": 5,
      "isCorrect": false
    },
    ...
  ]
}
``` 