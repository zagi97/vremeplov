# Admin Setup Script

## Problem
Photos are uploading successfully but not appearing in the admin dashboard because the admin user document in Firestore doesn't have the `isAdmin: true` field.

## Solution
You have **two options** to fix this:

### Option 1: Sign out and sign back in (EASIEST) ⭐
The code has been updated to automatically set `isAdmin: true` when the admin user signs in.

1. Go to your admin dashboard
2. Sign out
3. Sign back in with your admin credentials

The `createOrUpdateUser` function will automatically update your user document with `isAdmin: true`.

### Option 2: Run the setup script
If you prefer to run a script:

1. Make sure you have your environment variables set up (`.env` file with Firebase config)
2. Run the script:
   ```bash
   node scripts/setAdminFlag.js
   ```

This will find the admin user by email and set `isAdmin: true` in their Firestore document.

### Option 3: Manual update in Firebase Console
1. Go to Firebase Console → Firestore Database
2. Find the `users` collection
3. Find your user document (search by your admin email)
4. Click "Add field"
5. Field name: `isAdmin`
6. Type: `boolean`
7. Value: `true`
8. Save

## Verification
After applying any of the above solutions:

1. Go to the admin dashboard at `/admin`
2. Try uploading a photo from the main site
3. The photo should now appear in "Pending Photos" section
4. You should be able to approve or reject it

## What Changed
- Added `isAdmin?: boolean` field to `UserDocument` interface
- Updated `authService.createOrUpdateUser()` to set `isAdmin: true` for admin users
- Firestore rules already check for this field to grant admin permissions
