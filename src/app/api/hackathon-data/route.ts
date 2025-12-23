import { NextResponse } from 'next/server';
import { getHackathonSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getHackathonSettings();
    
    console.log('Hackathon settings:', {
      startDateAndTime: settings.startDateAndTime,
      endDateAndTime: settings.endDateAndTime
    });
    
    return NextResponse.json({
      'end-date-and-time': settings.endDateAndTime,
      'friday': settings.friday,
      'saturday': settings.saturday,
      'sunday': settings.sunday,
      'monday': settings.monday,
      'tuesday': settings.tuesday,
      'wednesday': settings.wednesday,
      'thursday': settings.thursday,
      'dateOrder': settings.dateOrder,
      'start-date-and-time': settings.startDateAndTime,
      'admin-slack-ids': settings.adminSlackIds
    });
  } catch (error) {
    console.error('Error fetching hackathon data:', error);
    return NextResponse.json({ error: 'Failed to fetch hackathon data' }, { status: 500 });
  }
}
