// src/utils/municipalityLoader.ts
import { normalizeCountyName, normalizeCountyForComparison } from './locationUtils';

type MunicipalityRecord = [number, string, string, string];

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
  const { municipalityData } = await import('../../data/municipalities');

  const allLocations: Location[] = (municipalityData.records as MunicipalityRecord[]).map((record) => {
    const id = record[0];
    const county = record[1];
    const type = record[2];
    const name = record[3];
    
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
      const countyShort = normalizeCountyName(location.county);

      location.displayName = `${location.name} (${countyShort})`;
      location.urlKey = `${location.name}-${normalizeCountyForComparison(location.county)}`;
    }
  });

  // Cache for future use
  cachedLocations = allLocations;
  return allLocations;
};