// Firebase Cloud Functions
// Currently no active functions - notifications are handled in-app only

const {initializeApp} = require('firebase-admin/app');

initializeApp();

// No email functions needed - all notifications are in-app via Firestore
// The notifications collection in Firestore handles all user notifications
// and they are displayed in the NotificationBell component
