import React from 'react';
import { UserCheck, Trash2, RotateCcw } from 'lucide-react';
import { LocationData, DayColumn, WorkerItem } from '../types';
import { DAY_KEYS } from '../data/initialData';
import { containsBale } from '../utils/calculations';

interface TimesheetTableProps {
  currentLocation: string;
  locData: LocationData;
  dates: DayColumn[];
  selectedRoles: string[];
  roleBales: Record<string, number>;
  onUpdateAttendance: (workerId: string, dayKey: string, value: string) => void;
  onUpdateOT: (workerId: string, dayKey: string, value: number) => void;
  onUpdateRoleBale: (loc: string, role: string, val: number) => void;
  onUpdateWorkerBale?: (workerId: string, val: number) => void;
  onDeleteWorker: (workerId: string) => void;
  onOpenWorkerProfile: (workerId: string, workerName: string) => void;
  onResetRoleFilter: () => void;
}

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  currentLocation,
  locData,
  dates,
  selectedRoles,
  roleBales,
  onUpdateAttendance,
  onUpdateOT,
  onUpdateRoleBale,
  onUpdateWorkerBale,
  onDeleteWorker,
  onOpenWorkerProfile,
  onResetRoleFilter,
}) => {
  if (!locData || !locData.workers) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-500 font-semibold">
        No worker data found for {currentLocation}.
      </div>
    );
  }

  // Group workers by role
  const rolesGroup: Record<string, WorkerItem[]> = {};
  locData.workers.forEach((w) => {
    if (selectedRoles.length > 0 && !selectedRoles.includes(w.role)) return;
    if (!rolesGroup[w.role]) rolesGroup[w.role] = [];
    rolesGroup[w.role].push(w);
  });

  if (Object.keys(rolesGroup).length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-6 text-center shadow-sm">
        <p className="font-semibold text-sm mb-3">
          No workers match the selected role filter in <span className="font-bold">{currentLocation}</span>.
        </p>
        <button
          type="button"
          onClick={onResetRoleFilter}
          className="px-4 py-2 bg-[#d11a2a] hover:bg-[#b01321] text-white text-xs font-bold rounded flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Role Filter</span>
        </button>
      </div>
    );
  }

  const getAttendanceClass = (val: string) => {
    if (val === '1.0') return 'cell-att-full';
    if (val === '0.5') return 'cell-att-half';
    if (val === '1h' || val === '2h') return 'cell-att-gray';
    if (val === 'absent') return 'cell-att-absent';
    if (val === 'sick') return 'cell-att-sick';
    if (val === 'emergency') return 'cell-att-emergency';
    return 'bg-white';
  };

  return (
    <div className="space-y-6">
      {Object.keys(rolesGroup).map((role) => {
        const isRoleBale = containsBale(role);
        const roleBaleKey = `${currentLocation}_${role}`;
        const roleBaleVal = roleBales[roleBaleKey] || 0;
        const workers = rolesGroup[role];

        return (
          <div
            key={role}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Group Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold px-3 py-1 bg-[#0d0d0d] text-white rounded border-l-4 border-l-[#d11a2a] uppercase tracking-wider">
                  {role}
                </span>

                {isRoleBale && (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    <span className="text-[11px] font-bold text-[#d11a2a]">BALE: ₱</span>
                    <input
                      type="number"
                      value={roleBaleVal || ''}
                      placeholder="0"
                      onChange={(e) =>
                        onUpdateRoleBale(
                          currentLocation,
                          role,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 px-1.5 py-0.5 text-xs font-bold text-[#d11a2a] border border-[#d11a2a] rounded bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-gray-500">
                {workers.length} Worker{workers.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#0d0d0d] text-white text-xs uppercase tracking-wider">
                    <th className="p-3 font-bold sticky left-0 z-10 bg-[#0d0d0d] w-48 sm:w-56 shadow-sm border-r border-neutral-800">
                      Worker Name
                    </th>
                    {dates.map((d) => (
                      <th
                        key={d.key}
                        className="p-2 text-center font-bold min-w-[85px] border-r border-neutral-800"
                      >
                        <span className="block text-sm">{d.key}</span>
                        <span className="block text-[10px] font-normal text-gray-400">
                          {d.fullDateStr}
                        </span>
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold min-w-[90px] border-r border-neutral-800">
                      Totals
                    </th>
                    {isRoleBale && (
                      <th className="p-3 text-center font-bold min-w-[100px] border-r border-neutral-800 text-amber-400">
                        Bale (₱)
                      </th>
                    )}
                    <th className="p-3 text-center w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {workers.map((w) => {
                    let totalDays = 0;
                    let totalHours = 0;

                    DAY_KEYS.forEach((k) => {
                      const val = w.attendance[k] || '';
                      if (val === '1.0') totalDays += 1.0;
                      else if (val === '0.5') totalDays += 0.5;

                      const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
                      const otVal =
                        val === '1.0' || val === '0.5'
                          ? parseFloat(String(w.ot[k])) || 0
                          : 0;
                      totalHours += otVal + attHours;
                    });

                    return (
                      <tr key={w.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Worker Name with Profile button */}
                        <td className="p-2.5 font-bold uppercase sticky left-0 z-10 bg-white shadow-sm border-r border-gray-200">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate max-w-[150px]" title={w.name}>
                              {w.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenWorkerProfile(w.id, w.name)}
                              title="View Individual Worker Profile"
                              className="text-[#d11a2a] hover:text-[#b01321] p-1 rounded hover:bg-red-50 transition-colors no-print cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Attendance for 6 days */}
                        {DAY_KEYS.map((k) => {
                          const attVal = w.attendance[k] || '';
                          const otVal = w.ot[k] || 0;
                          const cellClass = getAttendanceClass(attVal);

                          return (
                            <td
                              key={k}
                              className={`p-1.5 text-center border-r border-gray-200 ${cellClass}`}
                            >
                              <select
                                value={attVal}
                                onChange={(e) =>
                                  onUpdateAttendance(w.id, k, e.target.value)
                                }
                                className="w-full text-center text-[11px] font-bold py-1 px-0.5 rounded border border-gray-300 bg-white/90 focus:outline-none focus:ring-1 focus:ring-[#d11a2a] cursor-pointer mb-1"
                              >
                                <option value="">-</option>
                                <option value="1.0">1.0 (Full)</option>
                                <option value="0.5">0.5 (Half)</option>
                                <option value="1h">1h (Hr)</option>
                                <option value="2h">2h (Hr)</option>
                                <option value="absent">Absent</option>
                                <option value="sick">Sick</option>
                                <option value="emergency">Emerg</option>
                              </select>

                              {attVal === '1.0' || attVal === '0.5' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-[10px] text-gray-500 font-bold">
                                    OT:
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    value={otVal || 0}
                                    onChange={(e) =>
                                      onUpdateOT(
                                        w.id,
                                        k,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className={`w-11 text-center text-[11px] font-bold py-0.5 rounded border ${
                                      otVal > 0
                                        ? 'ot-active'
                                        : 'bg-white border-gray-300 text-gray-800'
                                    } focus:outline-none`}
                                  />
                                </div>
                              ) : (
                                <div className="h-[22px] flex items-center justify-center text-[10px] text-gray-400 select-none">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Totals */}
                        <td className="p-2 text-center bg-gray-50 border-r border-gray-200">
                          <div className="font-extrabold text-gray-900 text-xs">
                            {totalDays.toFixed(1)} D
                          </div>
                          <div className="font-bold text-[#d11a2a] text-[11px]">
                            {totalHours} hrs
                          </div>
                        </td>

                        {/* Bale input if role is bale */}
                        {isRoleBale && (
                          <td className="p-2 text-center bg-amber-50/50 border-r border-gray-200">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-xs font-bold text-amber-800">₱</span>
                              <input
                                type="number"
                                min="0"
                                value={w.baleValue || ''}
                                placeholder={roleBaleVal > 0 ? String(roleBaleVal) : '0'}
                                onChange={(e) =>
                                  onUpdateWorkerBale?.(
                                    w.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center text-xs font-black text-amber-950 py-1 px-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#d11a2a]"
                              />
                            </div>
                          </td>
                        )}

                        {/* Delete worker button */}
                        <td className="p-2 text-center no-print">
                          <button
                            type="button"
                            onClick={() => onDeleteWorker(w.id)}
                            title="Remove worker from site"
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
