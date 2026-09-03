import React, { useState } from 'react';
import {
  X,
  Award,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  MapPin
} from 'lucide-react';
import { TimesheetDB, WorkerItem } from '../types';
import { DAY_KEYS } from '../data/initialData';
import { calculateDatesForStart } from '../utils/calculations';

interface WorkerProfileModalProps {
  isOpen: boolean;
  workerId: string;
  workerName: string;
  timesheetDB: TimesheetDB;
  currentDate: string;
  onClose: () => void;
  onAddNote: (workerId: string, text: string) => void;
  onDeleteNote: (workerId: string, noteId: string) => void;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  isOpen,
  workerId,
  workerName,
  timesheetDB,
  currentDate,
  onClose,
  onAddNote,
  onDeleteNote,
}) => {
  const [newRemarkText, setNewRemarkText] = useState('');

  if (!isOpen) return null;

  // Find worker across timesheetDB
  let foundWorker: WorkerItem | null = null;
  let workerLoc = '';

  // Look in current week first
  const currentDayData = timesheetDB[currentDate];
  if (currentDayData?.locations) {
    for (const loc in currentDayData.locations) {
      const w = currentDayData.locations[loc].workers.find(
        (x) => x.id === workerId || x.name === workerName
      );
      if (w) {
        foundWorker = w;
        workerLoc = loc;
        break;
      }
    }
  }

  // If not found in current week, look anywhere in DB
  if (!foundWorker) {
    for (const dKey in timesheetDB) {
      const dObj = timesheetDB[dKey];
      if (dObj?.locations) {
        for (const loc in dObj.locations) {
          const w = dObj.locations[loc].workers.find(
            (x) => x.id === workerId || x.name === workerName
          );
          if (w) {
            foundWorker = w;
            workerLoc = loc;
            break;
          }
        }
      }
      if (foundWorker) break;
    }
  }

  if (!foundWorker) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <p className="text-red-600 font-bold mb-4">Worker record not found.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const targetName = foundWorker.name;
  let lifetimeFull = 0;
  let lifetimeHalf = 0;
  let lifetimeAbsent = 0;
  let lifetimeSick = 0;
  let lifetimeDays = 0;
  let lifetimeHours = 0;

  interface WeekHistoryItem {
    dateKey: string;
    dateRangeStr: string;
    workerObj: WorkerItem;
    datesList: ReturnType<typeof calculateDatesForStart>;
    weekDays: number;
    weekHours: number;
  }

  const weeklyHistoryRecords: WeekHistoryItem[] = [];

  for (const dKey in timesheetDB) {
    const dayData = timesheetDB[dKey];
    if (!dayData?.locations) continue;

    const weekDates = calculateDatesForStart(dKey);
    let weekDays = 0;
    let weekHours = 0;
    let hasWorkedThisWeek = false;
    let matchedWorkerRef: WorkerItem | null = null;

    for (const loc in dayData.locations) {
      const locWorkers = dayData.locations[loc].workers || [];
      const matched = locWorkers.find(
        (x) => x.name === targetName || x.id === workerId
      );
      if (matched) {
        matchedWorkerRef = matched;
        DAY_KEYS.forEach((k) => {
          const val = matched.attendance[k] || '';
          if (val === '1.0') {
            lifetimeFull++;
            weekDays += 1.0;
            lifetimeDays += 1.0;
            hasWorkedThisWeek = true;
          } else if (val === '0.5') {
            lifetimeHalf++;
            weekDays += 0.5;
            lifetimeDays += 0.5;
            hasWorkedThisWeek = true;
          } else if (val === 'absent') {
            lifetimeAbsent++;
            hasWorkedThisWeek = true;
          } else if (val === 'sick') {
            lifetimeSick++;
            hasWorkedThisWeek = true;
          }

          const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
          const otVal =
            val === '1.0' || val === '0.5'
              ? parseFloat(String(matched.ot[k])) || 0
              : 0;
          const combined = otVal + attHours;
          weekHours += combined;
          lifetimeHours += combined;
        });
      }
    }

    if (hasWorkedThisWeek && matchedWorkerRef) {
      weeklyHistoryRecords.push({
        dateKey: dKey,
        dateRangeStr:
          weekDates.length > 0
            ? `${weekDates[0].fullDateStr} - ${weekDates[weekDates.length - 1].fullDateStr}`
            : dKey,
        workerObj: matchedWorkerRef,
        datesList: weekDates,
        weekDays,
        weekHours,
      });
    }
  }

  weeklyHistoryRecords.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const lifetimeTotalLogged =
    lifetimeFull + lifetimeHalf + lifetimeAbsent + lifetimeSick;
  const lifetimeFullPct = lifetimeTotalLogged
    ? Math.round((lifetimeFull / lifetimeTotalLogged) * 100)
    : 0;
  const lifetimeHalfPct = lifetimeTotalLogged
    ? Math.round((lifetimeHalf / lifetimeTotalLogged) * 100)
    : 0;
  const lifetimeAbsentPct = lifetimeTotalLogged
    ? Math.round((lifetimeAbsent / lifetimeTotalLogged) * 100)
    : 0;

  const currentDates = calculateDatesForStart(currentDate);
  const notes = foundWorker.notesHistory || [];

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRemarkText.trim() && foundWorker) {
      onAddNote(foundWorker.id, newRemarkText.trim());
      setNewRemarkText('');
    }
  };

  const getAttendanceClass = (val: string) => {
    if (val === '1.0') return 'cell-att-full';
    if (val === '0.5') return 'cell-att-half';
    if (val === '1h' || val === '2h') return 'cell-att-gray';
    if (val === 'absent') return 'cell-att-absent';
    if (val === 'sick') return 'cell-att-sick';
    if (val === 'emergency') return 'cell-att-emergency';
    return '';
  };

  return (
    <div
      id="workerProfileModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="bg-[#0d0d0d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <h4 className="font-black text-sm sm:text-base flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-5 h-5 text-[#d11a2a]" />
            <span>Individual Worker Cumulative & Weekly Log Profile</span>
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          {/* Worker Info Card */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 border-l-4 border-l-[#d11a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase">
                {foundWorker.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-neutral-900 text-white rounded font-bold">
                  {foundWorker.role}
                </span>
                {workerLoc && (
                  <span className="px-2.5 py-0.5 bg-[#d11a2a] text-white rounded font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Site: {workerLoc}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Database Records Found
              </span>
              <span className="inline-block mt-0.5 px-3 py-1 bg-neutral-800 text-white font-bold rounded">
                {weeklyHistoryRecords.length} Active Week(s) Logged
              </span>
            </div>
          </div>

          {/* Lifetime Performance Card */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
            <h5 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#d11a2a]" />
              <span>Overall Lifetime Performance (All Recorded Weeks Across Database)</span>
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3 text-center">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-300">
                <span className="text-[10px] font-bold text-emerald-800 block">
                  LIFETIME FULL
                </span>
                <span className="text-base font-black text-emerald-950 block">
                  {lifetimeFull}
                </span>
              </div>

              <div className="p-2 rounded bg-amber-50 border border-amber-300">
                <span className="text-[10px] font-bold text-amber-800 block">
                  LIFETIME HALF
                </span>
                <span className="text-base font-black text-amber-950 block">
                  {lifetimeHalf}
                </span>
              </div>

              <div className="p-2 rounded bg-rose-50 border border-rose-300">
                <span className="text-[10px] font-bold text-rose-800 block">
                  LIFETIME ABSENT
                </span>
                <span className="text-base font-black text-rose-950 block">
                  {lifetimeAbsent}
                </span>
              </div>

              <div className="p-2 rounded bg-cyan-50 border border-cyan-300">
                <span className="text-[10px] font-bold text-cyan-800 block">
                  LIFETIME SICK
                </span>
                <span className="text-base font-black text-cyan-950 block">
                  {lifetimeSick}
                </span>
              </div>

              <div className="p-2 rounded bg-gray-100 border border-gray-300">
                <span className="text-[10px] font-bold text-gray-700 block">
                  TOTAL DAYS
                </span>
                <span className="text-base font-black text-gray-900 block">
                  {lifetimeDays.toFixed(1)} D
                </span>
              </div>

              <div className="p-2 rounded bg-red-50 border border-red-300">
                <span className="text-[10px] font-bold text-[#d11a2a] block">
                  TOTAL OT / EXTRA
                </span>
                <span className="text-base font-black text-[#d11a2a] block">
                  {lifetimeHours} hrs
                </span>
              </div>
            </div>

            {/* Lifetime ratio progress bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-gray-200 mb-2">
              <div
                className="bar-seg-full"
                style={{ width: `${lifetimeFullPct}%` }}
                title={`Full: ${lifetimeFullPct}%`}
              />
              <div
                className="bar-seg-half"
                style={{ width: `${lifetimeHalfPct}%` }}
                title={`Half: ${lifetimeHalfPct}%`}
              />
              <div
                className="bar-seg-absent"
                style={{ width: `${lifetimeAbsentPct}%` }}
                title={`Absent: ${lifetimeAbsentPct}%`}
              />
            </div>

            <div className="flex justify-between text-[11px] font-semibold text-gray-600 px-1">
              <span>Full Day Ratio: {lifetimeFullPct}%</span>
              <span>Half Day Ratio: {lifetimeHalfPct}%</span>
              <span>Absent Ratio: {lifetimeAbsentPct}%</span>
            </div>
          </div>

          {/* Current Selected Week Table */}
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4 text-[#d11a2a]" />
              <span>
                Weekly Attendance Breakdown (Current Selected Week:{' '}
                {currentDates[0]?.fullDateStr || ''} -{' '}
                {currentDates[currentDates.length - 1]?.fullDateStr || ''})
              </span>
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-gray-300">
                <thead className="bg-[#0d0d0d] text-white">
                  <tr>
                    {currentDates.map((d) => (
                      <th key={d.key} className="p-2 border border-neutral-700">
                        <div>{d.key}</div>
                        <div className="text-[10px] font-normal text-gray-400">
                          {d.fullDateStr}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {currentDates.map((d) => {
                      const attVal = foundWorker?.attendance[d.key] || '-';
                      const otVal = parseFloat(String(foundWorker?.ot[d.key])) || 0;
                      const cls = getAttendanceClass(attVal);

                      return (
                        <td key={d.key} className={`p-2 border border-gray-300 ${cls}`}>
                          <div className="font-bold text-xs">{attVal}</div>
                          {otVal > 0 && (attVal === '1.0' || attVal === '0.5') && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-[#d11a2a] text-white text-[10px] font-bold mt-1">
                              {otVal}h OT
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Weeks Historical Logs */}
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#d11a2a]" />
              <span>
                Historical Log Records Across All Past Weeks (
                {weeklyHistoryRecords.length} Weeks Recorded)
              </span>
            </h5>

            {weeklyHistoryRecords.length > 0 ? (
              <div className="space-y-3">
                {weeklyHistoryRecords.map((item) => (
                  <div
                    key={item.dateKey}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-300"
                  >
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-neutral-900 text-white rounded text-[11px] font-bold">
                        Period: {item.dateRangeStr} ({item.dateKey})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-700 text-white rounded font-bold text-[11px]">
                          {item.weekDays.toFixed(1)} Days
                        </span>
                        <span className="px-2 py-0.5 bg-[#d11a2a] text-white rounded font-bold text-[11px]">
                          {item.weekHours} hrs OT/Ext
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse border border-gray-300 bg-white">
                        <thead className="bg-gray-200 text-gray-800">
                          <tr>
                            {item.datesList.map((d) => (
                              <th
                                key={d.key}
                                className="p-1 border border-gray-300 text-[10px]"
                              >
                                <div>{d.key}</div>
                                <div className="text-[9px] text-gray-500 font-normal">
                                  {d.fullDateStr}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {item.datesList.map((d) => {
                              const aVal = item.workerObj.attendance[d.key] || '-';
                              const oVal =
                                parseFloat(String(item.workerObj.ot[d.key])) || 0;
                              const cls = getAttendanceClass(aVal);

                              return (
                                <td
                                  key={d.key}
                                  className={`p-1.5 border border-gray-300 ${cls}`}
                                >
                                  <div className="font-bold">{aVal}</div>
                                  {oVal > 0 && (aVal === '1.0' || aVal === '0.5') && (
                                    <span className="inline-block px-1 py-0.2 rounded bg-[#d11a2a] text-white text-[9px] font-bold">
                                      {oVal}h
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-xs">
                No past weekly logs found in database.
              </p>
            )}
          </div>

          {/* Personal Remarks & Notes History */}
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#d11a2a]" />
              <span>Worker Personal Remarks & Logs History ({notes.length}):</span>
            </h5>

            <form onSubmit={handleAddRemark} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                placeholder="Add custom remark or note for this worker..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#d11a2a]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#d11a2a] hover:bg-[#b01321] text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Remark</span>
              </button>
            </form>

            {notes.length > 0 ? (
              <div className="space-y-1.5">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 bg-neutral-50 rounded border border-neutral-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-neutral-800 text-white rounded text-[10px] font-bold">
                        {n.timestamp || n.date}
                      </span>
                      <span className="font-medium text-gray-900">{n.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(foundWorker!.id, n.id)}
                      className="text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-xs">
                No custom comments logged yet for this worker.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-100 px-5 py-3 flex justify-end border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white font-bold rounded text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
