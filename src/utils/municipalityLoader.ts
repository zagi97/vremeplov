// src/utils/municipalityLoader.ts
export interface Location {
  id: number;
  county: string;
  type: string;
  name: string;
  displayName: string;
  urlKey: string;
}

let cachedLocations: Location[] | null = null;

export const loadMunicipalities = async (): Promise<Location[]> => {
  // Return cached if already loaded
  if (cachedLocations) {
    return cachedLocations;
  }

  // ✅ LAZY LOAD: Dynamic import!
  const municipalityData = await import('../../data/municipalities.json');
  
  const allLocations: Location[] = municipalityData.default.records.map((record: any) => {
    const id = record[0] as number;
    const county = record[1] as string;
    const type = record[2] as string;
    const name = record[3] as string;
    
    return {
      id,
      county,
      type,
      name,
      displayName: name,
      urlKey: name
    };
  });

  // Handle duplicates (same logic as before)
  const nameCounts = new Map<string, number>();
  allLocations.forEach(location => {
    nameCounts.set(location.name, (nameCounts.get(location.name) || 0) + 1);
  });

  allLocations.forEach(location => {
    if (nameCounts.get(location.name)! > 1) {
      const countyShort = location.county
        .replace(/^[IVX]+\s/, '')
        .replace('DUBROVAČKO-NERETVANSKA', 'Dubrovačko-neretvanska')
        .replace('SPLITSKO-DALMATINSKA', 'Splitsko-dalmatinska')
        .replace('OSJEČKO-BARANJSKA', 'Osječko-baranjska')
        .replace('VUKOVARSKO-SRIJEMSKA', 'Vukovarsko-srijemska')
        .replace('POŽEŠKO-SLAVONSKA', 'Požeško-slavonska')
        .replace('BRODSKO-POSAVSKA', 'Brodsko-posavska')
        .replace('VIROVITIČKO-PODRAVSKA', 'Virovitičko-podravska')
        .replace('KOPRIVNIČKO-KRIŽEVAČKA', 'Koprivničko-križevačka')
        .replace('BJELOVARSKO-BILOGORSKA', 'Bjelovarsko-bilogorska')
        .replace('PRIMORSKO-GORANSKA', 'Primorsko-goranska')
        .replace('SISAČKO-MOSLAVAČKA', 'Sisačko-moslavačka')
        .replace('KRAPINSKO-ZAGORSKA', 'Krapinsko-zagorska')
        .replace('ŠIBENSKO-KNINSKA', 'Šibensko-kninska')
        .replace('LIČKO-SENJSKA', 'Ličko-senjska')
        .replace('KARLOVAČKA', 'Karlovačka')
        .replace('VARAŽDINSKA', 'Varaždinska')
        .replace('ZAGREBAČKA', 'Zagrebačka')
        .replace('MEĐIMURSKA', 'Međimurska')
        .replace('ISTARSKA', 'Istarska')
        .replace('ZADARSKA', 'Zadarska')
        .replace('GRAD ZAGREB', 'Zagreb');
      
      location.displayName = `${location.name} (${countyShort})`;
      location.urlKey = `${location.name}-${countyShort.replace(/\s+/g, '')}`;
    }
  });

  // Cache for future use
  cachedLocations = allLocations;
  return allLocations;
};