import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  Clock,
  MessageSquare,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { LocationData, WorkerItem } from '../types';
import { DAY_KEYS } from '../data/initialData';
import {
  getWorkerMetrics,
  getWorkerAutomatedRemarks,
  getAutomatedSiteRemark
} from '../utils/calculations';

interface SiteAnalyticsProps {
  currentLocation: string;
  locData: LocationData;
  selectedRoles: string[];
  currentDate: string;
  onAddSiteRemark: (text: string) => void;
  onDeleteSiteRemark: (remarkId: string) => void;
  onAddWorkerNote: (workerId: string, text: string) => void;
  onDeleteWorkerNote: (workerId: string, noteId: string) => void;
}

export const SiteAnalytics: React.FC<SiteAnalyticsProps> = ({
  currentLocation,
  locData,
  selectedRoles,
  onAddSiteRemark,
  onDeleteSiteRemark,
  onAddWorkerNote,
  onDeleteWorkerNote,
}) => {
  const [siteRemarkInput, setSiteRemarkInput] = useState('');
  const [workerNoteInputs, setWorkerNoteInputs] = useState<Record<string, string>>({});

  if (!locData || !locData.workers || locData.workers.length === 0) {
    return null;
  }

  let filteredWorkers = locData.workers;
  if (selectedRoles.length > 0) {
    filteredWorkers = filteredWorkers.filter((w) => selectedRoles.includes(w.role));
  }

  let fullDays = 0;
  let halfDays = 0;
  let hourlyCount = 0;
  let absents = 0;
  let sickCount = 0;
  let emergencyCount = 0;
  let totalOT = 0;
  let totalShiftsLogged = 0;

  filteredWorkers.forEach((w) => {
    DAY_KEYS.forEach((k) => {
      const val = w.attendance[k] || '';
      if (val === '1.0') {
        fullDays++;
        totalShiftsLogged++;
      } else if (val === '0.5') {
        halfDays++;
        totalShiftsLogged++;
      } else if (val === '1h' || val === '2h') {
        hourlyCount++;
        totalShiftsLogged++;
      } else if (val === 'absent') {
        absents++;
        totalShiftsLogged++;
      } else if (val === 'sick') {
        sickCount++;
        totalShiftsLogged++;
      } else if (val === 'emergency') {
        emergencyCount++;
        totalShiftsLogged++;
      }
      const ot = val === '1.0' || val === '0.5' ? parseFloat(String(w.ot[k])) || 0 : 0;
      totalOT += ot;
    });
  });

  const fullPct = totalShiftsLogged ? Math.round((fullDays / totalShiftsLogged) * 100) : 0;
  const halfPct = totalShiftsLogged ? Math.round((halfDays / totalShiftsLogged) * 100) : 0;
  const hourlyPct = totalShiftsLogged ? Math.round((hourlyCount / totalShiftsLogged) * 100) : 0;
  const absentPct = totalShiftsLogged ? Math.round((absents / totalShiftsLogged) * 100) : 0;
  const sickPct = totalShiftsLogged ? Math.round((sickCount / totalShiftsLogged) * 100) : 0;
  const emergencyPct = totalShiftsLogged ? Math.round((emergencyCount / totalShiftsLogged) * 100) : 0;

  const autoSiteRemark = getAutomatedSiteRemark(fullPct, halfPct, absentPct, totalShiftsLogged);

  const degFull = (fullPct / 100) * 360;
  const degHalf = degFull + (halfPct / 100) * 360;
  const degHourly = degHalf + (hourlyPct / 100) * 360;
  const degSick = degHourly + (sickPct / 100) * 360;
  const degAbsent = degSick + (absentPct / 100) * 360;

  const conicStyle =
    totalShiftsLogged > 0
      ? {
          background: `conic-gradient(#198754 0deg ${degFull}deg, #ffc107 ${degFull}deg ${degHalf}deg, #6c757d ${degHalf}deg ${degHourly}deg, #0dcaf0 ${degHourly}deg ${degSick}deg, #dc3545 ${degSick}deg ${degAbsent}deg, #6f42c1 ${degAbsent}deg 360deg)`,
        }
      : { background: '#e9ecef' };

  const handleAddSiteRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (siteRemarkInput.trim()) {
      onAddSiteRemark(siteRemarkInput.trim());
      setSiteRemarkInput('');
    }
  };

  const handleWorkerNoteSubmit = (workerId: string) => {
    const text = workerNoteInputs[workerId]?.trim();
    if (text) {
      onAddWorkerNote(workerId, text);
      setWorkerNoteInputs((prev) => ({ ...prev, [workerId]: '' }));
    }
  };

  const remarksList = locData.siteRemarksHistory || [];

  return (
    <section
      id="siteStatsContainer"
      className="bg-white border border-gray-200 border-l-4 border-l-[#d11a2a] rounded-xl p-4 sm:p-5 mb-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-[#d11a2a]" />
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          {currentLocation} - Attendance & Analytics{' '}
          {selectedRoles.length > 0 ? (
            <span className="text-xs text-gray-500 font-normal">
              ({selectedRoles.join(', ')})
            </span>
          ) : null}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-center">
        {/* Pie/Donut Chart */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-gray-200">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Site Performance Breakdown
          </span>

          <div
            className="w-36 h-36 rounded-full flex items-center justify-center shadow-md relative"
            style={conicStyle}
          >
            <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-gray-900 leading-none">
                {totalShiftsLogged}
              </span>
              <span className="text-[10px] font-bold text-gray-500 mt-0.5">LOGGED</span>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-1.5 mt-3 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
              Full ({fullPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-gray-900">
              Half ({halfPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-500 text-white">
              Hr ({hourlyPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-400 text-cyan-950">
              Sick ({sickPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white">
              Abs ({absentPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-700 text-white">
              Emg ({emergencyPct}%)
            </span>
          </div>
        </div>

        {/* Numeric Stat Cards */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between h-full">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div className="p-2 text-center rounded-lg bg-emerald-50 border border-emerald-300">
              <span className="text-[10px] font-bold text-emerald-800 block">FULL</span>
              <span className="text-lg font-black text-emerald-950 block">{fullDays}</span>
              <span className="text-[10px] font-semibold text-emerald-700">{fullPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-amber-50 border border-amber-300">
              <span className="text-[10px] font-bold text-amber-800 block">HALF</span>
              <span className="text-lg font-black text-amber-950 block">{halfDays}</span>
              <span className="text-[10px] font-semibold text-amber-700">{halfPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-gray-100 border border-gray-300">
              <span className="text-[10px] font-bold text-gray-700 block">HOURLY</span>
              <span className="text-lg font-black text-gray-900 block">{hourlyCount}</span>
              <span className="text-[10px] font-semibold text-gray-600">{hourlyPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-cyan-50 border border-cyan-300">
              <span className="text-[10px] font-bold text-cyan-800 block">SICK</span>
              <span className="text-lg font-black text-cyan-950 block">{sickCount}</span>
              <span className="text-[10px] font-semibold text-cyan-700">{sickPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-rose-50 border border-rose-300">
              <span className="text-[10px] font-bold text-rose-800 block">ABSENT</span>
              <span className="text-lg font-black text-rose-950 block">{absents}</span>
              <span className="text-[10px] font-semibold text-rose-700">{absentPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-purple-50 border border-purple-300">
              <span className="text-[10px] font-bold text-purple-800 block">EMERGENCY</span>
              <span className="text-lg font-black text-purple-950 block">{emergencyCount}</span>
              <span className="text-[10px] font-semibold text-purple-700">{emergencyPct}%</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50/70 rounded-lg border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <Clock className="w-4 h-4 text-[#d11a2a]" />
              <span>TOTAL OVERTIME WORKED:</span>
            </div>
            <span className="text-base font-black text-[#d11a2a]">{totalOT} Hours</span>
          </div>
        </div>
      </div>

      {/* Automated Site Health Remark & Permanent Announcements */}
      <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-300 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#d11a2a]" />
            <span>SITE HEALTH REMARK (AUTOMATED RESULT):</span>
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              autoSiteRemark.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : autoSiteRemark.type === 'danger'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : autoSiteRemark.type === 'warning'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}
          >
            {autoSiteRemark.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
            {autoSiteRemark.type === 'danger' && <AlertTriangle className="w-3 h-3" />}
            {autoSiteRemark.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
            {autoSiteRemark.type === 'info' && <Info className="w-3 h-3" />}
            <span>{autoSiteRemark.text}</span>
          </span>
        </div>

        <form onSubmit={handleAddSiteRemark} className="mt-2">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Add Site Remark / Announcement (Saved Permanently):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={siteRemarkInput}
              onChange={(e) => setSiteRemarkInput(e.target.value)}
              placeholder="Type new site remark or note..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#d11a2a]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </form>

        {remarksList.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <span className="text-xs font-bold text-gray-700 block">
              Permanent Site Remarks History:
            </span>
            {remarksList.map((r) => (
              <div
                key={r.id}
                className="bg-amber-50 border border-amber-200 p-2 rounded flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-neutral-800 text-white rounded text-[10px] font-bold">
                    {r.timestamp || r.date}
                  </span>
                  <span className="font-semibold text-gray-800">{r.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteSiteRemark(r.id)}
                  className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker Individual Shift Breakdown Cards */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-3">
          <Users className="w-3.5 h-3.5 text-[#d11a2a]" />
          <span>INDIVIDUAL WORKER DETAILED SHIFT BREAKDOWN & REMARKS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredWorkers.map((w) => {
            const m = getWorkerMetrics(w);
            const autoRemarks = getWorkerAutomatedRemarks(w);
            const notes = w.notesHistory || [];

            return (
              <div
                key={w.id}
                className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-xs uppercase text-gray-900 truncate">
                      {w.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-800 text-white rounded">
                      {w.role}
                    </span>
                  </div>

                  {/* Add note input */}
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      value={workerNoteInputs[w.id] || ''}
                      onChange={(e) =>
                        setWorkerNoteInputs((prev) => ({
                          ...prev,
                          [w.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleWorkerNoteSubmit(w.id);
                      }}
                      placeholder="Add Remark / Note..."
                      className="flex-1 px-2 py-1 text-[11px] bg-white border border-gray-300 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleWorkerNoteSubmit(w.id)}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-900 text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>

                  {/* Worker notes list */}
                  {notes.length > 0 && (
                    <div className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                      {notes.map((n) => (
                        <div
                          key={n.id}
                          className="bg-white p-1 rounded border border-gray-200 text-[10px] flex items-center justify-between"
                        >
                          <span className="text-gray-800 truncate mr-1">💬 {n.text}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteWorkerNote(w.id, n.id)}
                            className="text-red-500 hover:text-red-700 font-bold shrink-0 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stacked Progress Bar */}
                  <div className="h-2 rounded-full overflow-hidden flex bg-gray-200 mb-1.5">
                    <div
                      className="bar-seg-full"
                      style={{ width: `${m.fullPct}%` }}
                      title={`Full Day: ${m.fullPct}%`}
                    />
                    <div
                      className="bar-seg-half"
                      style={{ width: `${m.halfPct}%` }}
                      title={`Half Day: ${m.halfPct}%`}
                    />
                    <div
                      className="bar-seg-gray"
                      style={{ width: `${m.hourlyPct}%` }}
                      title={`Hourly: ${m.hourlyPct}%`}
                    />
                    <div
                      className="bar-seg-sick"
                      style={{ width: `${m.sickPct}%` }}
                      title={`Sick: ${m.sickPct}%`}
                    />
                    <div
                      className="bar-seg-absent"
                      style={{ width: `${m.absentPct}%` }}
                      title={`Absent: ${m.absentPct}%`}
                    />
                    <div
                      className="bar-seg-emergency"
                      style={{ width: `${m.emergencyPct}%` }}
                      title={`Emergency: ${m.emergencyPct}%`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1 text-[9px] font-bold text-gray-700 mb-2">
                    <span className="text-emerald-700">{m.fullPct}% Full</span>
                    <span>•</span>
                    <span className="text-amber-700">{m.halfPct}% Half</span>
                    <span>•</span>
                    <span className="text-cyan-700">{m.sickPct}% Sick</span>
                    <span>•</span>
                    <span className="text-rose-700">{m.absentPct}% Abs</span>
                  </div>
                </div>

                {/* Automated Remarks */}
                <div className="border-t border-gray-200 pt-1.5 mt-auto">
                  {autoRemarks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {autoRemarks.map((r, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            r.type === 'great'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.type === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          • {r.text}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[10px] font-medium">
                      Normal performance
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
