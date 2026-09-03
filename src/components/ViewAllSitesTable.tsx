import React from 'react';
import { LocationData, DayColumn } from '../types';
import { DAY_KEYS } from '../data/initialData';

interface ViewAllSitesTableProps {
  locations: Record<string, LocationData>;
  dates: DayColumn[];
  selectedRoles: string[];
}

export const ViewAllSitesTable: React.FC<ViewAllSitesTableProps> = ({
  locations,
  dates,
  selectedRoles,
}) => {
  const getAttendanceClass = (val: string) => {
    if (val === '1.0') return 'cell-att-full';
    if (val === '0.5') return 'cell-att-half';
    if (val === '1h' || val === '2h') return 'cell-att-gray';
    if (val === 'absent') return 'cell-att-absent';
    if (val === 'sick') return 'cell-att-sick';
    if (val === 'emergency') return 'cell-att-emergency';
    return '';
  };

  const locationEntries = (Object.entries(locations) as [string, LocationData][]).filter(([_, locData]) => {
    if (!locData || !locData.workers || locData.workers.length === 0) return false;
    if (selectedRoles.length > 0) {
      return locData.workers.some((w) => selectedRoles.includes(w.role));
    }
    return true;
  });

  if (locationEntries.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-6 text-center shadow-sm">
        <p className="font-semibold text-sm">
          No records found matching your view options.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {locationEntries.map(([locName, locData]) => {
        let filteredWorkers = locData.workers;
        if (selectedRoles.length > 0) {
          filteredWorkers = filteredWorkers.filter((w) => selectedRoles.includes(w.role));
        }

        let locTotalDays = 0;
        let locTotalOT = 0;

        filteredWorkers.forEach((w) => {
          DAY_KEYS.forEach((k) => {
            const val = w.attendance[k] || '';
            if (val === '1.0') locTotalDays += 1.0;
            else if (val === '0.5') locTotalDays += 0.5;

            const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
            const otVal =
              val === '1.0' || val === '0.5' ? parseFloat(String(w.ot[k])) || 0 : 0;
            locTotalOT += otVal + attHours;
          });
        });

        return (
          <div
            key={locName}
            className="bg-white border border-gray-200 border-l-4 border-l-[#d11a2a] rounded-xl overflow-hidden shadow-sm"
          >
            {/* Location Header */}
            <div className="bg-[#0d0d0d] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase">{locName}</h3>
                {locData.isDone && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded">
                    DONE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-[#d11a2a] text-white rounded">
                  ₱ Bale: {locData.baleValue || 0}
                </span>
                <span className="px-2.5 py-1 bg-white text-gray-900 rounded">
                  {filteredWorkers.length} Worker{filteredWorkers.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Location Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-neutral-800 text-white text-xs uppercase tracking-wider">
                    <th className="p-3 font-bold sticky left-0 z-10 bg-neutral-800 w-52 sm:w-60 border-r border-neutral-700">
                      Worker Name / Role
                    </th>
                    {dates.map((d) => (
                      <th
                        key={d.key}
                        className="p-2 text-center font-bold min-w-[85px] border-r border-neutral-700"
                      >
                        <span className="block text-sm">{d.key}</span>
                        <span className="block text-[10px] font-normal text-gray-300">
                          {d.fullDateStr}
                        </span>
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold min-w-[90px]">Totals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredWorkers.map((w) => {
                    let wDays = 0;
                    let wOT = 0;

                    DAY_KEYS.forEach((k) => {
                      const val = w.attendance[k] || '';
                      if (val === '1.0') wDays += 1.0;
                      else if (val === '0.5') wDays += 0.5;

                      const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
                      const otVal =
                        val === '1.0' || val === '0.5'
                          ? parseFloat(String(w.ot[k])) || 0
                          : 0;
                      wOT += otVal + attHours;
                    });

                    return (
                      <tr key={w.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-2.5 font-bold sticky left-0 z-10 bg-white border-r border-gray-200 shadow-sm">
                          <div className="text-gray-900 uppercase">{w.name}</div>
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded mt-0.5">
                            {w.role}
                          </span>
                        </td>

                        {DAY_KEYS.map((k) => {
                          const attVal = w.attendance[k] || '-';
                          const otVal = parseFloat(String(w.ot[k])) || 0;
                          const cls = getAttendanceClass(attVal);

                          return (
                            <td
                              key={k}
                              className={`p-2 text-center border-r border-gray-200 ${cls}`}
                            >
                              <div className="font-bold text-xs">{attVal}</div>
                              {otVal > 0 && (attVal === '1.0' || attVal === '0.5') && (
                                <span className="inline-block text-[10px] font-bold px-1 rounded bg-[#d11a2a] text-white mt-0.5">
                                  {otVal}h OT
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2 text-center bg-gray-50">
                          <div className="font-extrabold text-gray-900 text-xs">
                            {wDays.toFixed(1)} D
                          </div>
                          <div className="font-bold text-[#d11a2a] text-[11px]">
                            {wOT} hrs
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#0d0d0d] text-white font-bold text-xs">
                  <tr>
                    <td className="p-3 sticky left-0 z-10 bg-[#0d0d0d]">LOCATION TOTALS:</td>
                    <td colSpan={6}></td>
                    <td className="p-3 text-center">
                      <div>{locTotalDays.toFixed(1)} D</div>
                      <div className="text-amber-400 text-[11px]">{locTotalOT} hrs</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
