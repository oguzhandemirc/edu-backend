const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email gönderme fonksiyonu
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      secure: config.emailSecure,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
  }

  /**
   * Email gönderme
   * @param {Object} options - Email gönderme seçenekleri
   * @param {String} options.to - Alıcı email adresi
   * @param {String} options.subject - Email konusu
   * @param {String} options.text - Düz metin içeriği
   * @param {String} options.html - HTML içeriği
   * @returns {Promise<Object>} - Gönderim sonucunu içeren Promise
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Şifre sıfırlama kodu emaili gönderme
   * @param {String} email - Kullanıcı email adresi
   * @param {String} resetCode - Sıfırlama kodu
   * @returns {Promise<Object>} - Gönderim sonucunu içeren Promise
   */
  async sendPasswordResetCode(email, resetCode) {
    const subject = 'Şifrenizi Sıfırlayın';
    const text = `Şifrenizi sıfırlamak için kodonuz: ${resetCode}. Bu kod 20 dakika geçerlidir.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Şifrenizi Sıfırlayın</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${resetCode}
        </div>
        <p style="margin-top: 20px;">Bu kod <strong>20 dakika</strong> geçerlidir.</p>
        <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Bu otomatik olarak gönderilmiş bir emaildir. Lütfen yanıtlamayınız.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Email değişikliği doğrulama kodu emaili gönderme
   * @param {String} email - Yeni email adresi
   * @param {String} verificationCode - Doğrulama kodu
   * @returns {Promise<Object>} - Gönderim sonucunu içeren Promise
   */
  async sendEmailChangeCode(email, verificationCode) {
    const subject = 'E-posta Adresinizi Doğrulayın';
    const text = `E-posta adresinizi değiştirmek için doğrulama kodunuz: ${verificationCode}. Bu kod 20 dakika geçerlidir.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">E-posta Adresinizi Doğrulayın</h2>
        <p>E-posta adresinizi değiştirmek için aşağıdaki doğrulama kodunu kullanın:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${verificationCode}
        </div>
        <p style="margin-top: 20px;">Bu kod <strong>20 dakika</strong> geçerlidir.</p>
        <p>Eğer e-posta değişikliği talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Bu otomatik olarak gönderilmiş bir e-postadır. Lütfen yanıtlamayınız.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }
}

module.exports = new EmailService(); 