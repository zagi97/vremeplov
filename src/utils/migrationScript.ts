// utils/migrationScript.ts
// POKRETAJ OVO SAMO JEDNOM U CONSOLE-u ili kao zasebnu funkciju!

import { photoService, geocodingService } from '../services/firebaseService';

// Croatian cities with their approximate coordinates
const CROATIAN_CITY_COORDINATES: { [key: string]: { latitude: number, longitude: number } } = {
  'Zagreb': { latitude: 45.8150, longitude: 15.9819 },
  'Split': { latitude: 43.5081, longitude: 16.4402 },
  'Rijeka': { latitude: 45.3271, longitude: 14.4422 },
  'Osijek': { latitude: 45.5550, longitude: 18.6955 },
  'Zadar': { latitude: 44.1194, longitude: 15.2314 },
  'Pula': { latitude: 44.8666, longitude: 13.8496 },
  'Slavonski Brod': { latitude: 45.1600, longitude: 18.0158 },
  'Karlovac': { latitude: 45.4870, longitude: 15.5553 },
  'Varaždin': { latitude: 46.3044, longitude: 16.3377 },
  'Šibenik': { latitude: 43.7350, longitude: 15.8952 },
  'Čakovec': { latitude: 46.3840, longitude: 16.4318 },
  'Velika Gorica': { latitude: 45.7119, longitude: 16.0758 },
  'Vukovar': { latitude: 45.3552, longitude: 19.0006 },
  'Dubrovnik': { latitude: 42.6507, longitude: 18.0944 },
  'Bjelovar': { latitude: 45.8986, longitude: 16.8481 },
  'Koprivnica': { latitude: 46.1628, longitude: 16.8267 },
  'Sisak': { latitude: 45.4658, longitude: 16.3772 },
  'Čačince': { latitude: 45.6236, longitude: 17.8403 },
  'Virovitica': { latitude: 45.8313, longitude: 17.3834 },
  'Požega': { latitude: 45.3400, longitude: 17.6856 },
  'Slavonska Požega': { latitude: 45.3400, longitude: 17.6856 },
  'Đakovo': { latitude: 45.3081, longitude: 18.4106 },
  'Vinkovci': { latitude: 45.2886, longitude: 18.8047 },
  'Nova Gradiška': { latitude: 45.2553, longitude: 17.3831 },
  'Pakrac': { latitude: 45.4347, longitude: 17.1906 },
  'Lipik': { latitude: 45.4167, longitude: 17.1500 },
  'Daruvar': { latitude: 45.5908, longitude: 17.2247 },
  'Grubišno Polje': { latitude: 45.6969, longitude: 17.1781 },
  'Slatina': { latitude: 45.7064, longitude: 17.7094 }
};

export const migratePhotosWithCoordinates = async (): Promise<void> => {
  console.log('🚀 Starting photo coordinates migration...');
  
  try {
    // Dohvati sve fotografije
    const allPhotos = await photoService.getAllPhotos();
    console.log(`Found ${allPhotos.length} photos to process`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const photo of allPhotos) {
      // Preskoci ako već ima koordinate
      if (photo.coordinates) {
        console.log(`📍 Skipping photo ${photo.id} - already has coordinates`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔄 Processing photo: ${photo.description} in ${photo.location}`);
      
      try {
        let coordinates = null;
        
        // 1. Pokušaj naći u našoj listi poznatih gradova
        if (CROATIAN_CITY_COORDINATES[photo.location]) {
          coordinates = CROATIAN_CITY_COORDINATES[photo.location];
          console.log(`✅ Found coordinates from preset for ${photo.location}:`, coordinates);
        } 
        // 2. Ako nema u presets, pokušaj geocoding
        else {
          console.log(`🔍 Geocoding location: ${photo.location}`);
          coordinates = await geocodingService.getCoordinatesFromAddress('', photo.location);
          
          if (coordinates) {
            console.log(`✅ Geocoded coordinates for ${photo.location}:`, coordinates);
            // Dodaj u naš preset za buduće fotografije
            CROATIAN_CITY_COORDINATES[photo.location] = coordinates;
          } else {
            console.log(`❌ Could not geocode: ${photo.location}`);
          }
        }
        
        // 3. Ažuriraj fotografiju s koordinatama
        if (coordinates && photo.id) {
          await photoService.updatePhotoCoordinates(photo.id, {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: '' // Prazna adresa za postojeće fotografije
          });
          
          successCount++;
          console.log(`✅ Updated photo ${photo.id} with coordinates`);
        } else {
          console.log(`❌ No coordinates found for photo ${photo.id} in ${photo.location}`);
          errorCount++;
        }
        
        // Pauza između zahtjeva da ne overloadamo Nominatim API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`❌ Error processing photo ${photo.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('🏁 Migration completed!');
    console.log(`✅ Success: ${successCount} photos updated`);
    console.log(`⏩ Skipped: ${skippedCount} photos (already had coordinates)`);
    console.log(`❌ Errors: ${errorCount} photos failed`);
    
    return;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ✅ FUNKCIJA za pokretanje migracije - možeš je pozvati iz browser console
export const runMigration = async () => {
  const confirmed = confirm(
    'This will update all photos in your database with coordinates. ' +
    'This operation cannot be undone. Do you want to continue?'
  );
  
  if (confirmed) {
    try {
      await migratePhotosWithCoordinates();
      alert('Migration completed successfully! Check the console for details.');
    } catch (error) {
      alert('Migration failed! Check the console for error details.');
      console.error('Migration error:', error);
    }
  }
};

// ✅ Za development - export na window da možeš pozvati iz console
if (typeof window !== 'undefined') {
  (window as any).runPhotoMigration = runMigration;
}