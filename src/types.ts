export interface WorkerNote {
  id: string;
  text: string;
  date: string;
  timestamp: string;
}

export interface SiteRemark {
  id: string;
  text: string;
  date: string;
  timestamp: string;
}

export interface WorkerItem {
  id: string;
  name: string;
  role: string;
  baleValue: number;
  notesHistory: WorkerNote[];
  attendance: Record<string, string>; // key: 'S' | 'M' | 'T' | 'W' | 'Th' | 'F' -> value
  ot: Record<string, number>; // key -> overtime hours
}

export interface LocationData {
  baleValue: number;
  isDone?: boolean;
  siteRemarksHistory?: SiteRemark[];
  workers: WorkerItem[];
}

export interface TimesheetDayData {
  startDate: string;
  locations: Record<string, LocationData>;
  roleBales?: Record<string, number>;
}

export type TimesheetDB = Record<string, TimesheetDayData>;

export interface DayColumn {
  key: string;
  dayNum: number;
  monthStr: string;
  fullDateStr: string;
}

export interface WorkerMetrics {
  full: number;
  half: number;
  hourly: number;
  absent: number;
  sick: number;
  emergency: number;
  totalLogged: number;
  fullPct: number;
  halfPct: number;
  hourlyPct: number;
  absentPct: number;
  sickPct: number;
  emergencyPct: number;
}

export interface WorkerAutoRemark {
  type: 'great' | 'warning' | 'danger';
  text: string;
}

export type UserRole = 'admin' | 'staff';

export interface UserAccount {
  username: string;
  password: string;
  role: UserRole;
  createdAt?: string;
}
