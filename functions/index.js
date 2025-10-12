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
    let subject, htmlContent;

    switch(data.type) {
      case 'photo_rejected':
        subject = 'Vremeplov.hr - Odbijanje fotografije';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Fotografija odbijena</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaša fotografija je odbijena iz sljedećeg razloga:</p>
            <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #dc2626;">
              ${data.reason || 'Nije naveden razlog.'}
            </blockquote>
            <p>Molimo vas da pročitate naše smjernice zajednice prije ponovnog uploada.</p>
            <p>Hvala na razumijevanju!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      case 'photo_approved':
        subject = 'Vremeplov.hr - Fotografija odobrena! 🎉';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Fotografija odobrena!</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaša fotografija je uspješno odobrena i sada je vidljiva svima! 🎉</p>
            <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0;">
              Pogledaj fotografiju
            </a>
            <p>Hvala što dijelite uspomene s našom zajednicom!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      // ✅ NOVO - Photo Edited
      case 'photo_edited':
        subject = 'Vremeplov.hr - Fotografija ažurirana 📝';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Fotografija ažurirana</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaša fotografija "${data.photoTitle || 'Bez naslova'}" je ažurirana od strane administratora.</p>
            ${data.changes ? `
              <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0;">
                <strong>Promjene:</strong>
                <p style="margin: 5px 0 0 0;">${data.changes}</p>
              </div>
            ` : ''}
            <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0;">
              Pogledaj fotografiju
            </a>
            <p>Ako imate pitanja o promjenama, možete nas kontaktirati na vremeplov.app@gmail.com</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      // ✅ NOVO - Photo Deleted (Approved)
      case 'photo_deleted':
        subject = 'Vremeplov.hr - Fotografija uklonjena';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Fotografija uklonjena</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaša odobrena fotografija "${data.photoTitle || 'Bez naslova'}" je uklonjena od strane administratora.</p>
            ${data.reason ? `
              <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
                <strong>Razlog:</strong> ${data.reason}
              </blockquote>
            ` : ''}
            <p>Ako smatrate da je ovo učinjeno greškom ili imate pitanja, možete nas kontaktirati na vremeplov.app@gmail.com</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      case 'tag_rejected':
        subject = 'Vremeplov.hr - Odbijanje tagiranja osobe';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Tag odbijen</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaš zahtjev za tagiranje osobe je odbijen:</p>
            <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #dc2626;">
              ${data.reason || 'Nije naveden razlog.'}
            </blockquote>
            <p>Molimo vas da tagove koristite odgovorno i samo uz dopuštenje osoba.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      case 'tag_approved':
        subject = 'Vremeplov.hr - Tag odobren';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Tag odobren!</h2>
            <p>Poštovani ${userName},</p>
            <p>Vaš tag osobe "${data.taggedPersonName || 'osoba'}" je odobren i sada je vidljiv.</p>
            <a href="https://vremeplov.vercel.app/photo/${data.photoId}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0;">
              Pogledaj fotografiju
            </a>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Vremeplov.hr - Čuvamo sjećanja naših mjesta
            </p>
          </div>
        `;
        break;

      // ========================================
// 💬 COMMENT DELETED - Email Notification
// ========================================

case 'comment_deleted': {
  const mailOptions = {
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
            
            <p>Vaš komentar na fotografiji "<strong>${notificationData.photoTitle || 'Nepoznata fotografija'}</strong>" je uklonjen od strane administratora.</p>
            
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

  
  
  await transporter.sendMail(mailOptions);
  console.log('✅ Comment deletion email sent to:', userEmail);
  break;

  
}

// ========================================
// 👥 USER MODERATION NOTIFICATION CASES
// ========================================

case 'user_suspended': {
  const suspendUntilDate = new Date(data.suspendedUntil);
  const formattedDate = suspendUntilDate.toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const mailOptions = {
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
  
  await transporter.sendMail(mailOptions);
  console.log('✅ User suspension email sent to:', userEmail);
  break;
}

case 'user_banned': {
  const mailOptions = {
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
              <li>Ne možete pregledati sadržaje dok ste prijavljeni</li>
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
  
  await transporter.sendMail(mailOptions);
  console.log('✅ User ban email sent to:', userEmail);
  break;
}

case 'user_unsuspended': {
  const mailOptions = {
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
              <a href="https://vremeplov.vercel.app" class="button">Nastavi na Vremeplov</a>
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
  
  await transporter.sendMail(mailOptions);
  console.log('✅ User unsuspension email sent to:', userEmail);
  break;
}

case 'user_unbanned': {
  const mailOptions = {
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
            
            <p style="background: #fef3c7; padding: 12px; border-radius: 5px; border-left: 4px solid #f59e0b;">
              <strong>⚠️ Važno:</strong> Molimo vas da pažljivo poštujete pravila zajednice. Buduća kršenja mogu rezultirati trajnim isključenjem bez mogućnosti žalbe.
            </p>
            
            <div style="text-align: center;">
              <a href="https://vremeplov.vercel.app" class="button">Nastavi na Vremeplov</a>
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
  
  await transporter.sendMail(mailOptions);
  console.log('✅ User unban email sent to:', userEmail);
  break;
}

      default:
        console.error('❌ Unknown notification type:', data.type);
        return;
    }

    // Pošalji email
    const mailOptions = {
      from: '"Vremeplov.hr" <vremeplov.app@gmail.com>',
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

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