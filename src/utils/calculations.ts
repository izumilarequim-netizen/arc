import { DAY_KEYS } from '../data/initialData';
import { DayColumn, WorkerItem, WorkerMetrics, WorkerAutoRemark } from '../types';

export function getTodayFormatted(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDatesForStart(dateStr: string): DayColumn[] {
  if (!dateStr) return [];
  const [year, month, day] = dateStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const isSaturday = startDate.getDay() === 6;
  const result: DayColumn[] = [];
  for (let i = 0; i < 6; i++) {
    let offset = i;
    if (isSaturday && i > 0) offset = i + 1; // skip Sunday when starting on Saturday
    const d = new Date(year, month - 1, day + offset);
    result.push({
      key: DAY_KEYS[i],
      dayNum: d.getDate(),
      monthStr: d.toLocaleString('en-US', { month: 'short' }),
      fullDateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return result;
}

export function getWorkerMetrics(w: WorkerItem): WorkerMetrics {
  let full = 0;
  let half = 0;
  let hourly = 0;
  let absent = 0;
  let sick = 0;
  let emergency = 0;

  DAY_KEYS.forEach(k => {
    const v = w.attendance[k] || '';
    if (v === '1.0') full++;
    else if (v === '0.5') half++;
    else if (v === '1h' || v === '2h') hourly++;
    else if (v === 'absent') absent++;
    else if (v === 'sick') sick++;
    else if (v === 'emergency') emergency++;
  });

  const totalLogged = full + half + hourly + absent + sick + emergency;
  return {
    full,
    half,
    hourly,
    absent,
    sick,
    emergency,
    totalLogged,
    fullPct: totalLogged ? Math.round((full / totalLogged) * 100) : 0,
    halfPct: totalLogged ? Math.round((half / totalLogged) * 100) : 0,
    hourlyPct: totalLogged ? Math.round((hourly / totalLogged) * 100) : 0,
    absentPct: totalLogged ? Math.round((absent / totalLogged) * 100) : 0,
    sickPct: totalLogged ? Math.round((sick / totalLogged) * 100) : 0,
    emergencyPct: totalLogged ? Math.round((emergency / totalLogged) * 100) : 0,
  };
}

export function getWorkerAutomatedRemarks(w: WorkerItem): WorkerAutoRemark[] {
  let full = 0;
  let half = 0;
  let absent = 0;
  let sick = 0;
  let emergency = 0;

  DAY_KEYS.forEach(k => {
    const v = w.attendance[k] || '';
    if (v === '1.0') full++;
    else if (v === '0.5') half++;
    else if (v === 'absent') absent++;
    else if (v === 'sick') sick++;
    else if (v === 'emergency') emergency++;
  });

  const remarks: WorkerAutoRemark[] = [];
  if (full === 6) remarks.push({ type: 'great', text: 'Great performance' });
  if (half >= 3) remarks.push({ type: 'warning', text: 'Multiple half days' });
  if (absent >= 3) remarks.push({ type: 'danger', text: 'Multiple absents' });
  if (sick >= 1) remarks.push({ type: 'warning', text: `Sick leave logged (${sick}d)` });
  if (emergency >= 1) remarks.push({ type: 'warning', text: `Emergency leave logged (${emergency}d)` });
  return remarks;
}

export function getAutomatedSiteRemark(fullPct: number, halfPct: number, absentPct: number, totalShifts: number): { type: 'secondary' | 'success' | 'danger' | 'warning' | 'info'; text: string } {
  if (totalShifts === 0) return { type: 'secondary', text: 'No attendance records logged for this period.' };
  if (fullPct >= 80) return { type: 'success', text: '✔ Site operating with excellent worker attendance.' };
  if (absentPct >= 25) return { type: 'danger', text: '⚠ High absenteeism flagged across this site.' };
  if (halfPct >= 30) return { type: 'warning', text: '⚠ High concentration of half-day shifts.' };
  return { type: 'info', text: 'ℹ Moderate site activity and mixed shift attendance.' };
}

export function levDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function generateMathChallenge(): { question: string; answer: number } {
  const isAddition = Math.random() > 0.5;
  const num1 = Math.floor(Math.random() * 12) + 1;
  const num2 = Math.floor(Math.random() * 12) + 1;
  if (isAddition) {
    return { question: `${num1} + ${num2}`, answer: num1 + num2 };
  } else {
    const max = Math.max(num1, num2);
    const min = Math.min(num1, num2);
    return { question: `${max} - ${min}`, answer: max - min };
  }
}

export function containsBale(str: string): boolean {
  return str ? str.toUpperCase().includes('BALE') : false;
}
