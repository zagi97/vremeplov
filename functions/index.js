const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();

// ✅ Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vremeplov.app@gmail.com',
    pass: 'mlhntaambyppggcj'
  }
});

// ✅ Cloud Function v2 sintaksa
exports.sendContentNotification = onDocumentCreated(
  'notifications/{notificationId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const data = snapshot.data();
    console.log('📧 New notification created:', data);
    
    const db = getFirestore();
    
    // Dohvati korisničke podatke
    const userDoc = await db.collection('users').doc(data.userId).get();
    
    if (!userDoc.exists) {
      console.error('❌ User not found:', data.userId);
      return;
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    const userName = userData.displayName || 'Korisniče';

    console.log('👤 Sending email to:', userEmail);

    // Email template ovisno o tipu notifikacije
    let mailOptions;

    switch(data.type) {
      // ========================================
      // 📸 PHOTO REJECTED
      // ========================================
      case 'photo_rejected':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '📸 Vremeplov.hr - Fotografija odbijena',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .danger-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">📸 Fotografija odbijena</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaša fotografija je odbijena iz sljedećeg razloga:</p>
                  
                  <div class="danger-box">
                    <p><strong>Razlog:</strong></p>
                    <p>${data.reason || 'Nije naveden razlog.'}</p>
                  </div>
                  
                  <p>Molimo vas da pročitate naše smjernice zajednice prije ponovnog uploada.</p>
                  
                  <p>Ako smatrate da je ovo učinjeno greškom, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // 🎉 PHOTO APPROVED
      // ========================================
      case 'photo_approved':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '🎉 Vremeplov.hr - Fotografija odobrena!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d1fae5; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🎉 Fotografija odobrena!</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <div class="success-box">
                    <p><strong>Vaša fotografija je uspješno odobrena i sada je vidljiva svima! 🎉</strong></p>
                  </div>
                  
                  <p>Hvala što dijelite uspomene s našom zajednicom!</p>
                  
                  <div style="text-align: center;">
                    <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
   style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
  Pogledaj fotografiju
</a>
                  </div>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // 📝 PHOTO EDITED
      // ========================================
      case 'photo_edited':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '📝 Vremeplov.hr - Fotografija ažurirana',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">📝 Fotografija ažurirana</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaša fotografija "<strong>${data.photoTitle || 'Bez naslova'}</strong>" je ažurirana od strane administratora.</p>
                  
                  ${data.changes ? `
                    <div class="info-box">
                      <p><strong>Promjene:</strong></p>
                      <p>${data.changes}</p>
                    </div>
                  ` : ''}
                  
                  <p>Ako imate pitanja o promjenama, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div style="text-align: center;">
                    <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
   style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
  Pogledaj fotografiju
</a>
                  </div>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // 🗑️ PHOTO DELETED
      // ========================================
      case 'photo_deleted':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '🗑️ Vremeplov.hr - Fotografija uklonjena',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .danger-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🗑️ Fotografija uklonjena</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaša odobrena fotografija "<strong>${data.photoTitle || 'Bez naslova'}</strong>" je uklonjena od strane administratora.</p>
                  
                  ${data.reason ? `
                    <div class="danger-box">
                      <p><strong>Razlog:</strong></p>
                      <p>${data.reason}</p>
                    </div>
                  ` : ''}
                  
                  <p>Ako smatrate da je ovo učinjeno greškom ili imate pitanja, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // 🏷️ TAG REJECTED
      // ========================================
      case 'tag_rejected':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '🏷️ Vremeplov.hr - Tag odbijen',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .danger-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🏷️ Tag odbijen</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaš zahtjev za tagiranje osobe je odbijen:</p>
                  
                  <div class="danger-box">
                    <p><strong>Razlog:</strong></p>
                    <p>${data.reason || 'Tag je odbijen jer ne zadovoljava kriterije kvalitete.'}</p>
                  </div>
                  
                  <p>Molimo vas da tagove koristite odgovorno i samo uz dopuštenje osoba.</p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // ✅ TAG APPROVED
      // ========================================
      case 'tag_approved':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '✅ Vremeplov.hr - Tag odobren',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d1fae5; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">✅ Tag odobren!</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <div class="success-box">
                    <p><strong>Vaš tag osobe "${data.taggedPersonName || 'osoba'}" je odobren i sada je vidljiv! 🎉</strong></p>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
   style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
  Pogledaj fotografiju
</a>
                  </div>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // 💬 COMMENT DELETED
      // ========================================
      case 'comment_deleted':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '💬 Vremeplov.hr - Komentar uklonjen',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">💬 Komentar uklonjen</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaš komentar na fotografiji "<strong>${data.photoTitle || 'Nepoznata fotografija'}</strong>" je uklonjen od strane administratora.</p>
                  
                  <div class="info-box">
                    <p><strong>Razlog:</strong> Komentar ne ispunjava naše smjernice zajednice ili je označen kao neprikladan.</p>
                  </div>
                  
                  <p>Molimo vas da buduće komentare pišete u skladu s pravilima pristojnosti i poštovanja drugih korisnika.</p>
                  
                  <p>Ako smatrate da je ovo učinjeno greškom, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // ⚠️ USER SUSPENDED
      // ========================================
      case 'user_suspended': {
        const suspendUntilDate = new Date(data.suspendedUntil);
        const formattedDate = suspendUntilDate.toLocaleDateString('hr-HR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '⚠️ Vremeplov.hr - Račun privremeno suspendiran',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">⚠️ Račun suspendiran</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaš račun je privremeno suspendiran do <strong>${formattedDate}</strong>.</p>
                  
                  <div class="warning-box">
                    <p><strong>Razlog suspenzije:</strong></p>
                    <p>${data.reason || 'Kršenje pravila zajednice'}</p>
                  </div>
                  
                  <p><strong>Tijekom suspenzije ne možete:</strong></p>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Uploadati nove fotografije</li>
                    <li>Dodavati komentare</li>
                    <li>Tagati osobe na fotografijama</li>
                  </ul>
                  
                  <p style="margin-top: 20px;">Možete pregledati postojeće sadržaje, ali ne možete doprinositi dok suspenzija traje.</p>
                  
                  <p>Ako smatrate da je ovo učinjeno greškom ili imate pitanja, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;
      }

      // ========================================
      // 🚫 USER BANNED
      // ========================================
      case 'user_banned':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '🚫 Vremeplov.hr - Račun trajno blokiran',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .danger-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🚫 Račun trajno blokiran</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <p>Vaš račun je <strong>trajno blokiran</strong> zbog teških kršenja pravila zajednice.</p>
                  
                  <div class="danger-box">
                    <p><strong>Razlog:</strong></p>
                    <p>${data.reason || 'Ozbiljno kršenje pravila zajednice'}</p>
                  </div>
                  
                  <p><strong>Što ovo znači:</strong></p>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Pristup vašem računu je trajno onemogućen</li>
                    <li>Ne možete uploadati fotografije, komentirati ili tagati</li>
                    <li>Ne možete pregledati sadržave dok ste prijavljeni</li>
                  </ul>
                  
                  <p style="margin-top: 20px;">Ako smatrate da je odluka o banu nepravedna ili imate dodatna pitanja, možete podnijeti žalbu putem emaila na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // ✅ USER UNSUSPENDED
      // ========================================
      case 'user_unsuspended':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '✅ Vremeplov.hr - Račun ponovno aktivan',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d1fae5; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">✅ Dobrodošli natrag!</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <div class="success-box">
                    <p><strong>Vaš račun je ponovno aktivan! 🎉</strong></p>
                    <p>Suspenzija je uklonjena i možete nastaviti koristiti sve funkcionalnosti platforme.</p>
                  </div>
                  
                  <p><strong>Sada možete:</strong></p>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Uploadati nove fotografije</li>
                    <li>Komentirati na fotografije</li>
                    <li>Tagati osobe</li>
                    <li>Lajkati sadržaje</li>
                  </ul>
                  
                  <p style="margin-top: 20px;">Molimo vas da u budućnosti poštujete pravila zajednice kako biste izbjegli ponovnu suspenziju.</p>
                  
                  <div style="text-align: center;">
  <a href="https://vremeplov.vercel.app" 
     style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
    Nastavi na Vremeplov
  </a>
</div>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      // ========================================
      // ✅ USER UNBANNED
      // ========================================
      case 'user_unbanned':
        mailOptions = {
          from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
          to: userEmail,
          subject: '✅ Vremeplov.hr - Ban uklonjen',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d1fae5; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">✅ Drago nam je što se vraćate!</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>
                  
                  <div class="success-box">
                    <p><strong>Vaš ban je uklonjen! 🎉</strong></p>
                    <p>Nakon pregleda, odlučeno je da vam se omogući povratak na platformu.</p>
                  </div>
                  
                  <p>Vaš račun je ponovno potpuno funkcionalan i imate pristup svim funkcionalnostima.</p>
                  
                  <div class="warning-box">
                    <p><strong>⚠️ Važno:</strong> Molimo vas da pažljivo poštujete pravila zajednice. Buduća kršenja mogu rezultirati trajnim isključenjem bez mogućnosti žalbe.</p>
                  </div>
                  
                  <div style="text-align: center;">
  <a href="https://vremeplov.vercel.app" 
     style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
    Nastavi na Vremeplov
  </a>
</div>
                  
                  <div class="footer">
                    <p>Vremeplov.hr - Čuvamo sjećanja naših mjesta</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        };
        break;

      default:
        console.error('❌ Unknown notification type:', data.type);
        return;
    }

    // Pošalji email
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', userEmail);
      
      // Označi notifikaciju kao poslanu
      await snapshot.ref.update({ 
        emailSent: true, 
        sentAt: FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error sending email:', error);
      await snapshot.ref.update({ emailError: error.message });
    }
  }
);