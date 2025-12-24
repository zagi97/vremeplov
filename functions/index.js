const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const {Resend} = require('resend');

initializeApp();

// ✅ Define secret for Firebase Functions
const resendApiKey = defineSecret('RESEND_API_KEY');

// ✅ Cloud Function v2 sintaksa - AŽURIRANO za in-app notifikacije
exports.sendContentNotification = onDocumentCreated(
  {
    document: 'notifications/{notificationId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const data = snapshot.data();
    console.log('📧 New notification created:', data);

    // ✅ ✅ ✅ KRITIČNO - Provjeri requiresEmail flag
    // Ako je false ili undefined, ovo je samo in-app notifikacija
    if (!data.requiresEmail) {
      console.log('⏭️  Skipping email - in-app notification only for type:', data.type);
      console.log('✅ In-app notification created successfully');
      return null; // Izađi brzo, ne troši resurse
    }

    console.log('📨 This is a critical notification - sending email for type:', data.type);

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
    let emailData;

    switch(data.type) {
      // ========================================
      // 📸 PHOTO REJECTED (EMAIL)
      // ========================================
      case 'photo_rejected':
        emailData = {
          from: 'Vremeplov.hr <onboarding@resend.dev>',
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
      // 🚫 USER BANNED (EMAIL)
      // ========================================
      case 'user_banned':
        emailData = {
          from: 'Vremeplov.hr <onboarding@resend.dev>',
          to: userEmail,
          subject: '🚫 Vremeplov.hr - Račun bannan',
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
                  <h1 style="margin: 0; font-size: 28px;">🚫 Račun bannan</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>

                  <p>Vaš račun na Vremeplov.hr je trajno bannan.</p>

                  <div class="danger-box">
                    <p><strong>Razlog:</strong></p>
                    <p>${data.reason || 'Kršenje pravila zajednice.'}</p>
                  </div>

                  <p>Više nećete moći pristupiti svojem računu.</p>

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
      // ⚠️ USER SUSPENDED (EMAIL)
      // ========================================
      case 'user_suspended':
        emailData = {
          from: 'Vremeplov.hr <onboarding@resend.dev>',
          to: userEmail,
          subject: '⚠️ Vremeplov.hr - Račun suspendiran',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .warning-box { background: #fed7aa; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 5px; }
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

                  <p>Vaš račun na Vremeplov.hr je privremeno suspendiran.</p>

                  <div class="warning-box">
                    <p><strong>Razlog:</strong></p>
                    <p>${data.reason || 'Kršenje pravila zajednice.'}</p>
                    ${data.suspendedUntil ? `<p><strong>Suspenzija traje do:</strong> ${data.suspendedUntil}</p>` : ''}
                  </div>

                  <p>Nakon isteka suspenzije moći ćete ponovo pristupiti svojem računu.</p>

                  <p>Ako imate pitanja, možete nas kontaktirati na <a href="mailto:vremeplov.app@gmail.com" style="color: #3b82f6;">vremeplov.app@gmail.com</a></p>

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
      // ✅ USER UNBANNED (EMAIL)
      // ========================================
      case 'user_unbanned':
        emailData = {
          from: 'Vremeplov.hr <onboarding@resend.dev>',
          to: userEmail,
          subject: '✅ Vremeplov.hr - Dobrodošao/la natrag!',
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
                  <h1 style="margin: 0; font-size: 28px;">✅ Dobrodošao/la natrag!</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>

                  <div class="success-box">
                    <p><strong>Tvoj račun je ponovo aktivan! 🎉</strong></p>
                    <p>Možeš se ponovno prijaviti i nastaviti koristiti Vremeplov.hr</p>
                  </div>

                  <p>Nadamo se da ćeš nastaviti pozitivno doprinositi našoj zajednici.</p>

                  <div style="text-align: center;">
                    <a href="https://vremeplov.vercel.app"
                       style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
                      Prijavi se
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
      // ✅ USER UNSUSPENDED (EMAIL)
      // ========================================
      case 'user_unsuspended':
        emailData = {
          from: 'Vremeplov.hr <onboarding@resend.dev>',
          to: userEmail,
          subject: '✅ Vremeplov.hr - Suspenzija uklonjena',
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
                  <h1 style="margin: 0; font-size: 28px;">✅ Suspenzija uklonjena</h1>
                </div>
                <div class="content">
                  <p>Poštovani <strong>${userName}</strong>,</p>

                  <div class="success-box">
                    <p><strong>Suspenzija tvog računa je uklonjena! 🎉</strong></p>
                    <p>Možeš se ponovno prijaviti i nastaviti koristiti Vremeplov.hr</p>
                  </div>

                  <p>Dobrodošao/la natrag u našu zajednicu!</p>

                  <div style="text-align: center;">
                    <a href="https://vremeplov.vercel.app"
                       style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: 500;">
                      Prijavi se
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
        console.log('⚠️  Unknown notification type with requiresEmail=true:', data.type);
        return null;
    }

    // Pošalji email preko Resend
    try {
      // ✅ Initialize Resend inside function with secret value
      const resend = new Resend(resendApiKey.value());
      const result = await resend.emails.send(emailData);
      const emailId = result.data?.id || result.id || null;
      console.log('✅ Email sent successfully via Resend:', emailId);

      // Označi da je email poslan
      const updateData = {
        emailSent: true,
        emailSentAt: FieldValue.serverTimestamp(),
      };
      if (emailId) {
        updateData.emailId = emailId;
      }
      await snapshot.ref.update(updateData);

      return { success: true, emailId };
    } catch (error) {
      console.error('❌ Error sending email via Resend:', error);

      // Označi da email nije uspio
      await snapshot.ref.update({
        emailSent: false,
        emailError: error.message
      });

      throw error;
    }
  }
);
