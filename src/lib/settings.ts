import { databases, DB, APPWRITE_DATABASE_ID, Query } from './appwrite';

export interface HackathonSettings {
  endDateAndTime: string;
  friday: string;
  saturday: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  dateOrder: string[];
  startDateAndTime: string;
  adminSlackIds: string[];
  signUpsEnabled: boolean;
  eventCode: string;
  minAge: number;
  maxAge: number;
}

const settingsCache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function getSetting(key: string): Promise<string | null> {
  const now = Date.now();
  const cached = settingsCache.get(key);
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.value as string;
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', key)]
    );

    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (response.documents[0] as any).value;
      settingsCache.set(key, { value, timestamp: now });
      return value;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

function safeJsonParse(str: string | null, fallback: unknown): unknown {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    try {
      const fixed = str.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      return fallback;
    }
  }
}

function capitalizeDays(days: string[]): string[] {
  return days.map(day => day.charAt(0).toUpperCase() + day.slice(1));
}

export async function getHackathonSettings(): Promise<HackathonSettings> {
   const [
     endDateAndTime,
     friday,
     saturday,
     sunday,
     monday,
     tuesday,
     wednesday,
     thursday,
     dateOrder,
     startDateAndTime,
     adminSlackIds,
     signUpsEnabled,
     eventCode,
     minAge,
     maxAge
   ] = await Promise.all([
     getSetting('endDateAndTime'),
     getSetting('friday'),
     getSetting('saturday'),
     getSetting('sunday'),
     getSetting('monday'),
     getSetting('tuesday'),
     getSetting('wednesday'),
     getSetting('thursday'),
     getSetting('dateOrder'),
     getSetting('startDateAndTime'),
     getSetting('adminSlackIds'),
     getSetting('signUpsEnabled'),
     getSetting('eventCode'),
     getSetting('minAge'),
     getSetting('maxAge')
   ]);

   let parsedAdminIds: string[] = [];
   const adminParsed = safeJsonParse(adminSlackIds, []);
   if (Array.isArray(adminParsed)) {
     parsedAdminIds = adminParsed;
   } else if (typeof adminParsed === 'string' && adminParsed.trim()) {
     parsedAdminIds = [adminParsed];
   }

   return {
     endDateAndTime: endDateAndTime || '2026-06-22T23:59:59Z',
     friday: friday || '2026-06-19',
     saturday: saturday || '2026-06-20',
     sunday: sunday || '2026-06-21',
     monday: monday || '2026-06-22',
     tuesday: tuesday || '2026-06-23',
     wednesday: wednesday || '2026-06-24',
     thursday: thursday || '2026-06-25',
     dateOrder: capitalizeDays(safeJsonParse(dateOrder, ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) as string[]),
     startDateAndTime: startDateAndTime || '2026-06-19T00:00:00Z',
     adminSlackIds: parsedAdminIds,
     signUpsEnabled: signUpsEnabled === 'true',
     eventCode: eventCode || '',
     minAge: minAge ? parseInt(minAge) : 13,
     maxAge: maxAge ? parseInt(maxAge) : 100
   };
}
