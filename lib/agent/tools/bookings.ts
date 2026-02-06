import { ncbRead, ncbCreate, ncbUpdate, ncbDelete } from '../ncbClient';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  date: string;
  time_slot: string;
  status: string;
  meeting_type?: string;
  notes?: string;
  created_at?: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}

interface AvailabilitySetting {
  id: string;
  weekday: number;
  start_time: number;
  end_time: number;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function get_todays_bookings(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Booking>('bookings', cookies);
  const today = todayStr();
  const todays = (result.data || []).filter(b => b.date === today);
  return { date: today, bookings: todays, count: todays.length };
}

export async function get_upcoming_bookings(params: { days?: number }, cookies: string) {
  const days = params.days || 7;
  const result = await ncbRead<Booking>('bookings', cookies);
  const today = todayStr();
  const end = futureDate(days);
  const upcoming = (result.data || []).filter(b => b.date >= today && b.date <= end && b.status !== 'cancelled');
  return { from: today, to: end, bookings: upcoming, count: upcoming.length };
}

export async function list_bookings(params: { status?: string }, cookies: string) {
  const filters: Record<string, string> = {};
  if (params.status) filters.status = params.status;
  const result = await ncbRead<Booking>('bookings', cookies, filters);
  return { bookings: result.data || [], total: (result.data || []).length };
}

export async function confirm_booking(params: { booking_id: string }, cookies: string) {
  const result = await ncbUpdate<Booking>('bookings', params.booking_id, { status: 'confirmed' }, cookies);
  return { success: true, booking: result };
}

export async function cancel_booking(params: { booking_id: string; reason?: string }, cookies: string) {
  const data: Record<string, unknown> = { status: 'cancelled' };
  if (params.reason) data.cancellation_reason = params.reason;
  const result = await ncbUpdate<Booking>('bookings', params.booking_id, data, cookies);
  return { success: true, booking: result };
}

export async function block_date(params: { date: string; reason?: string }, userId: string, cookies: string) {
  const result = await ncbCreate<BlockedDate>('blocked_dates', { date: params.date, reason: params.reason || '' }, userId, cookies);
  return { success: true, blocked_date: result };
}

export async function unblock_date(params: { date: string }, cookies: string) {
  const result = await ncbRead<BlockedDate>('blocked_dates', cookies);
  const match = (result.data || []).find(bd => bd.date === params.date);
  if (!match) return { success: false, error: 'Date not found in blocked dates' };
  await ncbDelete('blocked_dates', match.id, cookies);
  return { success: true, date: params.date };
}

export async function get_availability(params: { date: string }, cookies: string) {
  // Check if date is blocked
  const blocked = await ncbRead<BlockedDate>('blocked_dates', cookies);
  if ((blocked.data || []).some(bd => bd.date === params.date)) {
    return { date: params.date, available: false, reason: 'Date is blocked', slots: [] };
  }

  // Get weekday settings
  const d = new Date(params.date + 'T12:00:00');
  const weekday = d.getDay();
  const settings = await ncbRead<AvailabilitySetting>('availability_settings', cookies);
  const daySetting = (settings.data || []).find(s => s.weekday === weekday);

  if (!daySetting) {
    // Default Mon-Fri 9am-5pm
    if (weekday === 0 || weekday === 6) {
      return { date: params.date, available: false, reason: 'Weekend - not available', slots: [] };
    }
    return { date: params.date, available: true, start: '09:00', end: '17:00', slot_duration: 30 };
  }

  const startHour = Math.floor(daySetting.start_time / 60);
  const startMin = daySetting.start_time % 60;
  const endHour = Math.floor(daySetting.end_time / 60);
  const endMin = daySetting.end_time % 60;

  return {
    date: params.date,
    available: true,
    start: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
    end: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
    slot_duration: 30,
  };
}

export async function get_booking_summary(_params: Record<string, never>, cookies: string) {
  const result = await ncbRead<Booking>('bookings', cookies);
  const bookings = result.data || [];
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    const status = b.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  const today = todayStr();
  const todaysCount = bookings.filter(b => b.date === today).length;
  const upcomingCount = bookings.filter(b => b.date > today && b.status !== 'cancelled').length;
  return { total: bookings.length, by_status: counts, today: todaysCount, upcoming: upcomingCount };
}
