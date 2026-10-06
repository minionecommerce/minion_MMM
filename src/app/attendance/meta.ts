// Wording, icons and colours of the six actions and of the history dots, shared by the day panel and the popups.

import { Briefcase, Home, LogIn, LogOut, MapPin, MapPinOff, type LucideIcon } from 'lucide-react';
import type { AttendanceAction, HistoryItem } from '@/lib/attendance/types';

export const ACTION_META: Record<AttendanceAction, { title: string; ask: string; Icon: LucideIcon; soft: string; strong: string }> = {
  CHECK_IN: { title: 'Check In', ask: 'Are you sure you want to Check In?', Icon: LogIn, soft: 'bg-[#DCFCE7]', strong: 'text-[#16A34A]' },
  CHECK_OUT: { title: 'Check Out', ask: 'Are you sure you want to Check Out?', Icon: LogOut, soft: 'bg-[#FEE2E2]', strong: 'text-[#DC2626]' },
  OFFICE_OUT: { title: 'Office Out', ask: 'Are you sure you want to mark Office Out?', Icon: Briefcase, soft: 'bg-[#FEE2E2]', strong: 'text-[#DC2626]' },
  OFFICE_IN: { title: 'Office In', ask: 'Are you sure you want to mark Office In?', Icon: Home, soft: 'bg-[#DCFCE7]', strong: 'text-[#16A34A]' },
  SITE_IN: { title: 'Site In', ask: 'Are you sure you want to mark Site In?', Icon: MapPin, soft: 'bg-[#DBEAFE]', strong: 'text-[#2563EB]' },
  SITE_OUT: { title: 'Site Out', ask: 'Are you sure you want to mark Site Out?', Icon: MapPinOff, soft: 'bg-[#FEE2E2]', strong: 'text-[#DC2626]' },
};

// Office Out and Site In ask where (a Site Visit Code or Other); the others only ask to confirm
export const NEEDS_PURPOSE: readonly AttendanceAction[] = ['OFFICE_OUT', 'SITE_IN'];

export const HISTORY_DOT: Record<HistoryItem['type'], string> = {
  CHECK_IN: 'bg-[#16A34A]',
  CHECK_OUT: 'bg-[#DC2626]',
  OFFICE_OUT: 'bg-[#F59E0B]',
  OFFICE_IN: 'bg-[#6B7280]',
  SITE_IN: 'bg-[#2563EB]',
  SITE_OUT: 'bg-[#7C3AED]',
};
