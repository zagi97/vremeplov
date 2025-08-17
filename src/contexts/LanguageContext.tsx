import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation object
type TranslationMap = { [key: string]: string };

const translations: Record<Language, TranslationMap> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',
    'nav.memoryMap': 'Memory Map',
    
    // Home page
    'home.title': 'Croatian Historical Photos',
    'home.subtitle': 'Preserve and share Croatia\'s rich photographic heritage',
    'home.description': 'Discover historical photographs from across Croatia. Share your own family photos and help preserve our cultural memory for future generations.',
    'home.upload': 'Upload Photo',
    'home.explore': 'Explore Gallery',
    'home.recent': 'Recent Photos',
    'home.reconnectTitle': 'Reconnect with Your Heritage',
    'home.discoverTitle': 'Discover Places',
    'home.discoverDesc': 'Search for any city or village in Croatia and explore its visual history on our interactive map.',
    'home.preserveTitle': 'Preserve Memories',
    'home.preserveDesc': 'Upload and share historical photos and videos from your family archives.',
    'home.connectTitle': 'Connect People',
    'home.connectDesc': 'Tag individuals, share stories, and reconnect with your community.',
    'home.exploreCroatiaTitle': 'Explore Croatia Through Time',
    'home.exploreCroatiaDesc': 'Discover historical photos geographically and see how your favorite places looked throughout history.',
    'home.exploreMemoryMap': 'Explore Memory Map',
    'home.glimpseTitle': 'Glimpse into the Past',
    'home.glimpseDesc': 'Browse through our collection of historical photos from various Croatian locations.',
    'home.startJourneyTitle': 'Start Your Journey Through Time',
    'home.startJourneyDesc': 'Join our community and help preserve the visual history of Croatia for future generations.',
    
    // Photo Detail Page
    'photoDetail.loading': 'Loading memory...',
    'photoDetail.notFound': 'Photo not found',
    'photoDetail.notFoundDesc': 'The requested memory could not be found.',
    'photoDetail.returnHome': 'Return to Homepage',
    'photoDetail.aboutPhoto': 'About this photo',
    'photoDetail.year': 'Year',
    'photoDetail.author': 'Author',
    'photoDetail.location': 'Location',
    'photoDetail.uploadedBy': 'Uploaded by',
    'photoDetail.on': 'on',
    'photoDetail.taggedPeople': 'Tagged People',
    'photoDetail.historicalContext': 'Historical Context',
    'photoDetail.relatedPhotos': 'Related Photos',
    'photoDetail.morePhotosFrom': 'More Photos from',
    'photoDetail.views': 'views',
    'photoDetail.likes': 'likes',
    'photoDetail.likePhoto': 'Like Photo',
    'photoDetail.unlikePhoto': 'Unlike Photo',
    'photoDetail.signInToLike': 'Sign In to Like',
    'photoDetail.signInMessage': 'Please sign in to like photos and interact with memories',
    'photoDetail.tagPerson': 'Tag Person',
    'photoDetail.clickToPosition': 'Click on the photo to position the tag',
    'photoDetail.personName': 'Person\'s name',
    'photoDetail.saveTag': 'Save Tag',
    'photoDetail.cancel': 'Cancel',
    'photoDetail.positionSelected': 'Position selected. Please enter a name for the tag.',
    'photoDetail.enterNameAndPosition': 'Please enter a name and select a position on the image',
    'photoDetail.taggedSuccess': 'Person tagged successfully!',
    'photoDetail.tagSaveFailed': 'Failed to add tag',
    'photoDetail.commentAdded': 'Comment added successfully!',
    'photoDetail.commentFailed': 'Failed to add comment',
    'photoDetail.photoLiked': 'Photo liked!',
    'photoDetail.photoUnliked': 'Photo unliked!',
    'photoDetail.likeFailed': 'Failed to update like',
    'photoDetail.historicalContextDesc': 'This period marked significant developments in the local history of {location}. Many similar photographs from this era document the changing landscape and daily life of inhabitants.',
    'photoDetail.defaultDescription': 'This historical photograph from {year} shows {description} in {location}. It was contributed to the Vremeplov.hr archive by {author}.',
    
    // Upload
    'upload.title': 'Share Historical Photo',
    'upload.select': 'Select Photo',
    'upload.drag': 'Drag and drop your photo here, or click to select',
    'upload.year': 'Year',
    'upload.author': 'Author/Photographer',
    'upload.description': 'Short Description',
    'upload.story': 'Detailed Story',
    'upload.submit': 'Upload Photo',
    'upload.cancel': 'Cancel',
    'upload.success': 'Photo uploaded successfully!',
    'upload.error': 'Failed to upload photo',
    'upload.offline': 'You are offline',
    'upload.tagPerson': 'Tag Person',
    'upload.enterName': 'Enter person\'s name',
    'upload.saveTag': 'Save Tag',
    'upload.cancelTag': 'Cancel',
    
    // Gallery
    'gallery.noPhotos': 'No photos yet',
    'gallery.noPhotosDesc': 'Be the first to share a historical photo and help preserve Croatian heritage!',
    'gallery.loading': 'Loading photos...',
    
    // Photo detail
    'photo.year': 'Year',
    'photo.author': 'Author',
    'photo.location': 'Location',
    'photo.story': 'Story',
    'photo.taggedPeople': 'Tagged People',
    'photo.comments': 'Comments',
    'photo.addComment': 'Add Comment',
    
    // Auth
    'auth.signInGoogle': 'Sign in with Google',
    'auth.signOut': 'Sign Out',
    'auth.signInSuccess': 'Successfully signed in!',
    'auth.signOutSuccess': 'Successfully signed out!',
    'auth.adminLogin': 'Admin Login',
    'auth.email': 'Email',
    'auth.password': 'Password',
    
    // Common
    'common.of': 'of',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.required': 'Required',
    'common.optional': 'Optional',
    
    // Footer
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.rights': 'All rights reserved',
    'footer.tagline': 'Preserving Croatian heritage, one memory at a time.',

     // SearchBar
    'search.placeholder': 'Search for a city or village...',
    'search.button': 'Search',
    'search.inputPlaceholder': 'Search location...',
    'search.noLocations': 'No locations found',

    // Location stranica
    'location.exploreHistory': 'Explore the history of',
    'location.throughPhotos': 'through photos and memories',
    'location.photos': 'photos',
    'location.addMemory': 'Add Memory',
    'location.signInToAdd': 'Sign In to Add Memory',
    'location.searchPlaceholder': 'Search photos, descriptions, authors, or tags...',
    'location.filters': 'Filters',
    'location.clear': 'Clear',
    'location.timePeriod': 'Time Period',
    'location.allYears': 'All years',
    'location.photoType': 'Photo Type',
    'location.sortBy': 'Sort By',
    'location.showing': 'Showing',
    'location.matching': 'matching',
    'location.from': 'from',
    'location.in': 'in',
    'location.noPhotosFound': 'No photos found',
    'location.tryAdjusting': 'Try adjusting your filters or search terms.',
    'location.beFirst': 'Be the first to share a historical photo of this location!',
    'location.clearAllFilters': 'Clear all filters',
    'location.loadingMemories': 'Loading memories...',
    'location.loadMoreMemories': 'Load More Memories',

    // Photo types
    'photoType.allTypes': 'All Types',
    'photoType.street': 'Street Scenes', 
    'photoType.building': 'Buildings',
    'photoType.people': 'People',
    'photoType.event': 'Events',
    'photoType.nature': 'Nature',
    
    // Sort options
    'sort.newest': 'Newest First',
    'sort.oldest': 'Oldest First',
    'sort.popular': 'Most Popular',
    'sort.yearNewest': 'Year (Newest)',
    'sort.yearOldest': 'Year (Oldest)',
    
    // PhotoUpload komponenta
    'upload.addPhotoTo': 'Add Historical Photo to',
    'upload.clickToUpload': 'Click to upload a historical photo',
    'upload.fileTypes': 'PNG, JPG, JPEG up to 5MB',
    'upload.specificAddress': 'Specific Address in',
    'upload.optional': '(Optional)',
    'upload.searchAddress': 'Search for street, landmark, or building...',
    'upload.trySearching': 'Try searching',
    'upload.selectYear': 'Select year',
    'upload.whoTookPhoto': 'Who took this photo?',
    'upload.location': 'Location',
    'upload.briefDescription': 'Brief description of the photo',
    'upload.detailedStory': 'Detailed Story (Optional)',
    'upload.shareStory': 'Share the story behind this photo, historical context, or personal memories...',
    'upload.fillRequired': 'Fill Required Fields',
    'upload.shareMemory': 'Share Memory',
    'upload.noConnection': 'No Connection',
    'upload.uploading': 'Uploading...',

    // Text
    'text.characterCounter': 'characters',

    // English translations (add to the 'en' object):
'comments.title': 'Comments ({count})',
'comments.placeholder': 'Share your memories or knowledge about this photo...',
'comments.postComment': 'Post Comment',
'comments.signInMessage': 'Sign in to share your memories and comments',
'comments.signInToComment': 'Sign In to Comment',
'comments.signInSuccess': 'Successfully signed in! You can now comment.',
'comments.signInError': 'Failed to sign in. Please try again.',
'comments.commentAdded': 'Your comment has been added!',
'comments.noComments': 'No comments yet. Be the first to share your thoughts!',

// English translations (add to the 'en' object):
'locationMap.photoLocation': 'Photo Location',
'locationMap.viewOnMap': 'View on Map',
'locationMap.viewPhoto': 'View photo',
'locationMap.location': 'Location',
'locationMap.address': 'Address',
'locationMap.nearbyPhotos': 'Nearby photos',

// English translations (add to the 'en' object):
'mapView.memoryMap': 'Memory Map',
'mapView.exploreCroatian': 'Explore Croatian heritage through interactive map',
'mapView.loadingMemoryMap': 'Loading memory map...',
'mapView.noLocatedPhotos': 'No Located Photos Yet',
'mapView.photosWillAppear': 'Photos will appear on the map once they are uploaded with specific addresses.',
'mapView.addPhotosTo': 'Add Photos to {location}',
'mapView.filters': 'Filters:',
'mapView.allDecades': 'All decades',
'mapView.searchByLocation': 'Search by location or address...',
'mapView.showing': 'Showing {filtered} of {total} photos',
'mapView.photosOnMap': 'Photos on Map',
'mapView.viewDetails': 'View Details',
'mapView.photosInArea': '{count} Photos in this area',
'mapView.morePhotos': '+{count} more photos',
'mapView.locatedPhotos': 'Located Photos',
'mapView.cities': 'Cities',
'mapView.specificAddresses': 'Specific Addresses',
'mapView.differentDecades': 'Different Decades',
'mapView.debugInfo': '🔍 Debug Info:',
'mapView.totalPhotos': 'Total photos:',
'mapView.filtered': 'Filtered:',
'mapView.currentZoom': 'Current zoom:',
'mapView.clusters': 'Clusters:',
'mapView.individualMarkers': 'Individual markers:',
'mapView.howClusteringWorks': '📍 How clustering works',
'mapView.clusteringDesc1': '• When multiple photos are close together, they group into numbered clusters',
'mapView.clusteringDesc2': '• Click on a cluster to see all photos in that area',
'mapView.clusteringDesc3': '• Zoom in to see individual photo markers',
'mapView.clusteringDesc4': '• Upload more photos to the same address to see clustering in action!',
  },
  hr: {
    // Navigation
    'nav.home': 'Početna',
    'nav.about': 'O nama',
    'nav.contact': 'Kontakt',
    'nav.dashboard': 'Kontrolna ploča',
    'nav.login': 'Prijava',
    'nav.logout': 'Odjava',
    'nav.admin': 'Admin',
    'nav.memoryMap': 'Memorijska karta',
    
    // Home page
    'home.title': 'Hrvatske povijesne fotografije',
    'home.subtitle': 'Sačuvajte i podijelite bogatu fotografsku baštinu Hrvatske',
    'home.description': 'Otkrijte povijesne fotografije iz cijele Hrvatske. Podijelite svoje obiteljske fotografije i pomozite sačuvati našu kulturnu memoriju za buduće generacije.',
    'home.upload': 'Učitaj fotografiju',
    'home.explore': 'Istraži galeriju',
    'home.recent': 'Nedavne fotografije',
    'home.reconnectTitle': 'Povežite se sa svojom baštinom',
    'home.discoverTitle': 'Otkrijte mjesta',
    'home.discoverDesc': 'Pretražite bilo koji grad ili selo u hrvatskoj i istražite njegovu vizualnu povijest na našoj interaktivnoj karti.',
    'home.preserveTitle': 'Sačuvajte sjećanja',
    'home.preserveDesc': 'Učitajte i podijelite povijesne fotografije i videozapise iz svojih obiteljskih arhiva.',
    'home.connectTitle': 'Povežite ljude',
    'home.connectDesc': 'Označite osobe, podijelite priče i povežite se sa svojom zajednicom.',
    'home.exploreCroatiaTitle': 'Istražite Hrvatsku kroz vrijeme',
    'home.exploreCroatiaDesc': 'Otkrijte povijesne fotografije geografski i vidite kako su vaša omiljena mjesta izgledala kroz povijest.',
    'home.exploreMemoryMap': 'Istražite memorijsku kartu',
    'home.glimpseTitle': 'Pogled u prošlost',
    'home.glimpseDesc': 'Pregledajte našu kolekciju povijesnih fotografija iz različitih hrvatskih lokacija.',
    'home.startJourneyTitle': 'Započnite svoje putovanje kroz vrijeme',
    'home.startJourneyDesc': 'Pridružite se našoj zajednici i pomozite sačuvati vizualnu povijest Hrvatske za buduće generacije.',
    
    // Photo Detail Page
    'photoDetail.loading': 'Učitavanje sjećanja...',
    'photoDetail.notFound': 'Fotografija nije pronađena',
    'photoDetail.notFoundDesc': 'Traženo sjećanje nije moglo biti pronađeno.',
    'photoDetail.returnHome': 'Vrati se na početnu',
    'photoDetail.aboutPhoto': 'O ovoj fotografiji',
    'photoDetail.year': 'Godina',
    'photoDetail.author': 'Autor',
    'photoDetail.location': 'Lokacija',
    'photoDetail.uploadedBy': 'Učitao',
    'photoDetail.on': 'dana',
    'photoDetail.taggedPeople': 'Označene osobe',
    'photoDetail.historicalContext': 'Povijesni kontekst',
    'photoDetail.relatedPhotos': 'Povezane fotografije',
    'photoDetail.morePhotosFrom': 'Više fotografija iz',
    'photoDetail.views': 'pogleda',
    'photoDetail.likes': 'sviđanja',
    'photoDetail.likePhoto': 'Sviđa mi se',
    'photoDetail.unlikePhoto': 'Ne sviđa mi se',
    'photoDetail.signInToLike': 'Prijavite se za ocjenu',
    'photoDetail.signInMessage': 'Molimo prijavite se da biste mogli ocijeniti fotografije i komunicirati sa sjećanjima',
    'photoDetail.tagPerson': 'Označi osobu',
    'photoDetail.clickToPosition': 'Kliknite na fotografiju da postavite oznaku',
    'photoDetail.personName': 'Ime osobe',
    'photoDetail.saveTag': 'Spremi oznaku',
    'photoDetail.cancel': 'Odustani',
    'photoDetail.positionSelected': 'Pozicija je odabrana. Molimo unesite ime za oznaku.',
    'photoDetail.enterNameAndPosition': 'Molimo unesite ime i odaberite poziciju na slici',
    'photoDetail.taggedSuccess': 'Osoba je uspješno označena!',
    'photoDetail.tagSaveFailed': 'Neuspješno dodavanje oznake',
    'photoDetail.commentAdded': 'Komentar je uspješno dodan!',
    'photoDetail.commentFailed': 'Neuspješno dodavanje komentara',
    'photoDetail.photoLiked': 'Fotografija označena kao sviđa!',
    'photoDetail.photoUnliked': 'Fotografija označena kao ne sviđa!',
    'photoDetail.likeFailed': 'Neuspješno ažuriranje ocjene',
    'photoDetail.historicalContextDesc': 'Ovo razdoblje je obilježilo značajan razvoj u lokalnoj povijesti mjesta {location}. Mnoge slične fotografije iz tog doba dokumentiraju mijenjajući se krajolik i svakodnevni život stanovnika.',
    'photoDetail.defaultDescription': 'Ova povijesna fotografija iz {year}. prikazuje {description} u {location}. Doprinijela ju je u arhiv Vremeplov.hr osoba {author}.',
    
    // Upload
    'upload.title': 'Podijeli povijesnu fotografiju',
    'upload.select': 'Odaberi fotografiju',
    'upload.drag': 'Povuci i spusti fotografiju ovdje ili klikni za odabir',
    'upload.year': 'Godina',
    'upload.author': 'Autor/Fotograf',
    'upload.description': 'Kratki opis',
    'upload.story': 'Detaljna priča',
    'upload.submit': 'Učitaj fotografiju',
    'upload.cancel': 'Odustani',
    'upload.success': 'Fotografija je uspješno učitana!',
    'upload.error': 'Neuspješno učitavanje fotografije',
    'upload.offline': 'Niste povezani s internetom',
    'upload.tagPerson': 'Označi osobu',
    'upload.enterName': 'Unesite ime osobe',
    'upload.saveTag': 'Spremi oznaku',
    'upload.cancelTag': 'Odustani',
    
    // Gallery
    'gallery.noPhotos': 'Nema fotografija',
    'gallery.noPhotosDesc': 'Budite prvi koji će podijeliti povijesnu fotografiju i pomoći sačuvati hrvatsku baštinu!',
    'gallery.loading': 'Učitavanje fotografija...',
    
    // Photo detail
    'photo.year': 'Godina',
    'photo.author': 'Autor',
    'photo.location': 'Lokacija',
    'photo.story': 'Priča',
    'photo.taggedPeople': 'Označene osobe',
    'photo.comments': 'Komentari',
    'photo.addComment': 'Dodaj komentar',
    
    // Auth
    'auth.signInGoogle': 'Prijavite se s Googleom',
    'auth.signOut': 'Odjava',
    'auth.signInSuccess': 'Uspješno ste se prijavili!',
    'auth.signOutSuccess': 'Uspješno ste se odjavili!',
    'auth.adminLogin': 'Admin prijava',
    'auth.email': 'Email',
    'auth.password': 'Lozinka',
    
    // Common
    'common.of': 'od',
    'common.save': 'Spremi',
    'common.cancel': 'Odustani',
    'common.edit': 'Uredi',
    'common.delete': 'Obriši',
    'common.loading': 'Učitavanje...',
    'common.error': 'Greška',
    'common.success': 'Uspjeh',
    'common.required': 'Obavezno',
    'common.optional': 'Neobavezno',
    
    // Footer
    'footer.about': 'O nama',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Pravila privatnosti',
    'footer.terms': 'Uvjeti korištenja',
    'footer.rights': 'Sva prava pridržana',
    'footer.tagline': 'Čuvamo hrvatsku baštinu, jedno sjećanje po jedno.',

    // SearchBar
    'search.placeholder': 'Pretražite grad ili selo...',
    'search.button': 'Pretraži',
    'search.inputPlaceholder': 'Pretražite lokaciju...',
    'search.noLocations': 'Nema pronađenih lokacija',

    // Location stranica
    'location.exploreHistory': 'Istražite povijest',
    'location.throughPhotos': 'kroz fotografije i sjećanja',
    'location.photos': 'fotografija',
    'location.addMemory': 'Dodaj sjećanje',
    'location.signInToAdd': 'Prijavite se za dodavanje',
    'location.searchPlaceholder': 'Pretražite fotografije, opise, autore ili oznake...',
    'location.filters': 'Filtri',
    'location.clear': 'Očisti',
    'location.timePeriod': 'Vremensko razdoblje',
    'location.allYears': 'Sve godine',
    'location.photoType': 'Tip fotografije',
    'location.sortBy': 'Sortiraj po',
    'location.showing': 'Prikazano',
    'location.matching': 'koji odgovaraju',
    'location.from': 'iz',
    'location.in': 'u',
    'location.noPhotosFound': 'Nema pronađenih fotografija',
    'location.tryAdjusting': 'Pokušajte prilagoditi filtre ili pojmove pretrage.',
    'location.beFirst': 'Budite prvi koji će podijeliti povijesnu fotografiju ove lokacije!',
    'location.clearAllFilters': 'Očisti sve filtre',
    'location.loadingMemories': 'Učitavanje sjećanja...',
    'location.loadMoreMemories': 'Učitaj više sjećanja',
    
    // Photo types
    'photoType.allTypes': 'Svi tipovi',
    'photoType.street': 'Ulični prizori',
    'photoType.building': 'Zgrade', 
    'photoType.people': 'Ljudi',
    'photoType.event': 'Događaji',
    'photoType.nature': 'Priroda',
    
    // Sort options
    'sort.newest': 'Najnovije prvo',
    'sort.oldest': 'Najstarije prvo',
    'sort.popular': 'Najpopularnije',
    'sort.yearNewest': 'Godina (najnovije)',
    'sort.yearOldest': 'Godina (najstarije)',
    
    // PhotoUpload komponenta
    'upload.addPhotoTo': 'Dodaj povijesnu fotografiju u',
    'upload.clickToUpload': 'Kliknite za učitavanje povijesne fotografije',
    'upload.fileTypes': 'PNG, JPG, JPEG do 5MB',
    'upload.specificAddress': 'Specifična adresa u',
    'upload.optional': '(Neobavezno)',
    'upload.searchAddress': 'Pretražite ulicu, znamenitost ili zgradu...',
    'upload.trySearching': 'Pokušajte pretražiti',
    'upload.selectYear': 'Odaberite godinu',
    'upload.whoTookPhoto': 'Tko je snimio ovu fotografiju?',
    'upload.location': 'Lokacija',
    'upload.briefDescription': 'Kratki opis fotografije',
    'upload.detailedStory': 'Detaljna priča (Neobavezno)',
    'upload.shareStory': 'Podijelite priču iza ove fotografije, povijesni kontekst ili osobna sjećanja...',
    'upload.fillRequired': 'Ispunite obavezna polja',
    'upload.shareMemory': 'Podijeli sjećanje',
    'upload.noConnection': 'Nema konekcije',
    'upload.uploading': 'Učitavanje...',

     // Text
    'text.characterCounter': 'znakova',

    // Croatian translations (add to the 'hr' object):
'comments.title': 'Komentari ({count})',
'comments.placeholder': 'Podijelite svoja sjećanja ili znanje o ovoj fotografiji...',
'comments.postComment': 'Objavi komentar',
'comments.signInMessage': 'Prijavite se da podijelite svoja sjećanja i komentare',
'comments.signInToComment': 'Prijavite se za komentiranje',
'comments.signInSuccess': 'Uspješno ste se prijavili! Sada možete komentirati.',
'comments.signInError': 'Neuspjeh pri prijavi. Molimo pokušajte ponovno.',
'comments.commentAdded': 'Vaš komentar je dodan!',
'comments.noComments': 'Još nema komentara. Budite prvi koji će podijeliti svoje misli!',

// Croatian translations (add to the 'hr' object):
'locationMap.photoLocation': 'Lokacija fotografije',
'locationMap.viewOnMap': 'Pogledaj na karti',
'locationMap.viewPhoto': 'Pogledaj fotografiju',
'locationMap.location': 'Lokacija',
'locationMap.address': 'Adresa',
'locationMap.nearbyPhotos': 'Obližnje fotografije',

// Croatian translations (add to the 'hr' object):
'mapView.memoryMap': 'Memorijska karta',
'mapView.exploreCroatian': 'Istražite hrvatsku baštinu kroz interaktivnu kartu',
'mapView.loadingMemoryMap': 'Učitavanje memorijske karte...',
'mapView.noLocatedPhotos': 'Još nema lociranih fotografija',
'mapView.photosWillAppear': 'Fotografije će se pojaviti na karti kada budu učitane s određenim adresama.',
'mapView.addPhotosTo': 'Dodaj fotografije u {location}',
'mapView.filters': 'Filtri:',
'mapView.allDecades': 'Sva desetljeća',
'mapView.searchByLocation': 'Pretraži po lokaciji ili adresi...',
'mapView.showing': 'Prikazano {filtered} od {total} fotografija',
'mapView.photosOnMap': 'Fotografije na karti',
'mapView.viewDetails': 'Pogledaj detalje',
'mapView.photosInArea': '{count} fotografija u ovom području',
'mapView.morePhotos': '+{count} fotografija više',
'mapView.locatedPhotos': 'Locirane fotografije',
'mapView.cities': 'Gradovi',
'mapView.specificAddresses': 'Specifične adrese',
'mapView.differentDecades': 'Različita desetljeća',
'mapView.debugInfo': '🔍 Debug informacije:',
'mapView.totalPhotos': 'Ukupno fotografija:',
'mapView.filtered': 'Filtrirano:',
'mapView.currentZoom': 'Trenutni zoom:',
'mapView.clusters': 'Klasteri:',
'mapView.individualMarkers': 'Pojedinačni markeri:',
'mapView.howClusteringWorks': '📍 Kako funkcionira klasteriranje',
'mapView.clusteringDesc1': '• Kada je više fotografija blizu jedna drugoj, grupiraju se u numerirane klastere',
'mapView.clusteringDesc2': '• Kliknite na klaster da vidite sve fotografije u tom području',
'mapView.clusteringDesc3': '• Uvećajte za prikaz pojedinačnih markera fotografija',
'mapView.clusteringDesc4': '• Učitajte više fotografija na istu adresu da vidite klasteriranje u akciji!'
  }
};

// Helper function for string interpolation
export const translateWithParams = (t: (key: string) => string, key: string, params: Record<string, string | number>) => {
  let translation = t(key);
  Object.entries(params).forEach(([param, value]) => {
    translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
  });
  return translation;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language, fallback to English
    const saved = localStorage.getItem('language') as Language;
    if (saved) return saved;
    
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('hr') ? 'hr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};