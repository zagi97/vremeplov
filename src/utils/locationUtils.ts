/**
 * Location utility functions for normalizing and formatting Croatian location names
 */

/**
 * Normalizes a county name by:
 * - Removing Roman numeral prefixes (e.g., "XVI ")
 * - Converting uppercase county names to proper case
 * - Handling special case for "GRAD ZAGREB"
 *
 * @param county - The county name to normalize
 * @returns Normalized county name
 */
export function normalizeCountyName(county: string): string {
  return county
    .replace(/^[IVX]+\s/, '') // Remove Roman numerals at start
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
}

/**
 * Normalizes a county name and removes whitespace for URL/comparison purposes
 *
 * @param county - The county name to normalize
 * @returns Normalized county name without whitespace
 */
export function normalizeCountyForComparison(county: string): string {
  return normalizeCountyName(county).replace(/\s+/g, '');
}

/**
 * Formats a display name for a location (city + county)
 *
 * @param cityName - The city/municipality name
 * @param county - The county name (will be normalized)
 * @returns Formatted display name like "Zagreb (Zagrebačka)"
 */
export function formatLocationDisplay(cityName: string, county: string): string {
  const normalizedCounty = normalizeCountyName(county);
  return `${cityName} (${normalizedCounty})`;
}

/**
 * Removes common prefixes from location names
 * (e.g., "Grad ", "Općina ")
 *
 * @param name - The location name
 * @returns Name without common prefixes
 */
export function removeLocationPrefixes(name: string): string {
  return name
    .replace(/^Grad\s+/i, '')
    .replace(/^Općina\s+/i, '')
    .trim();
}

/**
 * Removes "županija" suffix from county names
 *
 * @param countyName - The county name
 * @returns County name without "županija" suffix
 */
export function removeZupanijaSuffix(countyName: string): string {
  return countyName.replace(/\s*[žŽ]upanija$/i, '').trim();
}

/**
 * Fully normalizes a location name by removing prefixes and suffixes
 *
 * @param name - The location name
 * @returns Fully normalized name
 */
export function normalizeLocationName(name: string): string {
  return removeLocationPrefixes(removeZupanijaSuffix(name));
}

/**
 * Type for parsed location information
 */
export interface ParsedLocation {
  cityName: string;
  county: string | null;
  type: string | null;
  displayName: string;
  isSpecific: boolean;
}

/**
 * Parses a location from a URL parameter format (e.g., "Zagreb-Zagrebačka")
 * This function is used to extract location information from URL slugs.
 *
 * @param urlParam - The URL parameter to parse
 * @param municipalityData - Municipality data containing records
 * @returns Parsed location information
 */
export function parseLocationFromUrl(
  urlParam: string,
  municipalityData: { records: Array<[string | number, string, string, string]> }
): ParsedLocation {
  if (urlParam.includes('-')) {
    const parts = urlParam.split('-');
    const cityName = parts[0];
    const countyFromUrl = parts.slice(1).join('-');

    const record = municipalityData.records.find(record => {
      const recordName = record[3] as string;
      const recordCounty = normalizeCountyForComparison(record[1] as string);

      return recordName === cityName && recordCounty === countyFromUrl;
    });

    if (record) {
      const formattedCounty = normalizeCountyName(record[1] as string);

      return {
        cityName,
        county: record[1] as string,
        type: record[2] as string,
        displayName: formatLocationDisplay(cityName, formattedCounty),
        isSpecific: true,
      };
    } else {
      const fallbackRecord = municipalityData.records.find(record => record[3] === cityName);
      if (fallbackRecord) {
        return {
          cityName,
          county: fallbackRecord[1] as string,
          type: fallbackRecord[2] as string,
          displayName: cityName,
          isSpecific: false,
        };
      }
    }
  }

  return {
    cityName: urlParam,
    county: null,
    type: null,
    displayName: urlParam,
    isSpecific: false,
  };
}
