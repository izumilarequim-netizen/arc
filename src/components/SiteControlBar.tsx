import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  PlusCircle,
  Eraser,
  Trash2,
  CalendarX,
  History,
  Coins,
} from 'lucide-react';
import { calculateDatesForStart } from '../utils/calculations';

interface SiteControlBarProps {
  currentLocation: string;
  isDone: boolean;
  baleValue: number;
  showStats: boolean;
  currentDate: string;
  recordedDates: string[];
  dateRangeStr: string;
  onToggleDone: (done: boolean) => void;
  onToggleStats: () => void;
  onUpdateBale: (bale: number) => void;
  onSelectRecordedDate: (dateStr: string) => void;
  onOpenCreateSiteModal: () => void;
  onOpenClearRecordsModal: () => void;
  onOpenDeleteSiteModal: () => void;
  onOpenDeleteRecordedDateModal: () => void;
}

export const SiteControlBar: React.FC<SiteControlBarProps> = ({
  currentLocation,
  isDone,
  baleValue,
  showStats,
  currentDate,
  recordedDates,
  dateRangeStr,
  onToggleDone,
  onToggleStats,
  onUpdateBale,
  onSelectRecordedDate,
  onOpenCreateSiteModal,
  onOpenClearRecordsModal,
  onOpenDeleteSiteModal,
  onOpenDeleteRecordedDateModal,
}) => {
  const isViewAll = currentLocation === 'VIEW_ALL';

  return (
    <div
      id="siteControlBar"
      className="bg-white border border-gray-200 border-l-4 border-l-[#d11a2a] rounded-xl p-4 mb-4 shadow-sm"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Side: Site Info & Bales */}
        <div className="flex flex-col gap-2">
          {isViewAll ? (
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <span>ALL LOCATIONS MASTER SUMMARY</span>
              </h2>

              {/* Analytics Toggle for All Locations */}
              <button
                type="button"
                id="toggleStatsButton"
                onClick={onToggleStats}
                className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                  showStats
                    ? 'bg-[#d11a2a] text-white'
                    : 'bg-neutral-800 hover:bg-neutral-900 text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{showStats ? 'Hide Overall Analytics' : 'Overall Analytics'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {currentLocation}
              </h2>

              {/* Done Checkbox */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md text-xs font-bold transition-colors">
                <input
                  type="checkbox"
                  id="siteDoneCheckbox"
                  checked={isDone}
                  onChange={(e) => onToggleDone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                {isDone ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <span className="text-gray-700">Mark Done</span>
                )}
              </label>

              {/* Analytics Toggle */}
              <button
                type="button"
                id="toggleStatsButton"
                onClick={onToggleStats}
                className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                  showStats
                    ? 'bg-[#d11a2a] text-white'
                    : 'bg-neutral-800 hover:bg-neutral-900 text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{showStats ? 'Hide Analytics' : 'Analytics'}</span>
              </button>

              {/* Bale input */}
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                <span className="bg-[#d11a2a] text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Coins className="w-3 h-3" />
                  <span>BALE: ₱</span>
                </span>
                <input
                  type="number"
                  value={baleValue || ''}
                  placeholder="0"
                  onChange={(e) => onUpdateBale(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 text-xs font-bold text-[#d11a2a] border border-[#d11a2a] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
            </div>
          )}

          {/* Date info & Recorded dates dropdown */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span id="dateRangeSummary" className="text-gray-500 font-semibold">
              {dateRangeStr}
            </span>

            <div className="inline-flex items-center gap-1.5 no-print">
              <label
                htmlFor="recordedDatesSelect"
                className="font-bold text-gray-700 text-xs flex items-center gap-1 whitespace-nowrap"
              >
                <History className="w-3.5 h-3.5 text-[#d11a2a]" />
                <span>Recorded Dates:</span>
              </label>
              <select
                id="recordedDatesSelect"
                value={currentDate}
                onChange={(e) => onSelectRecordedDate(e.target.value)}
                className="text-xs font-bold px-2 py-1 bg-white border border-red-400 rounded focus:outline-none cursor-pointer"
              >
                {recordedDates.map((dStr) => {
                  const dList = calculateDatesForStart(dStr);
                  const sStr = dList[0]?.fullDateStr || dStr;
                  const eStr = dList[dList.length - 1]?.fullDateStr || dStr;
                  return (
                    <option key={dStr} value={dStr}>
                      {sStr} - {eStr} ({dStr})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 xl:justify-end no-print">
          <button
            type="button"
            id="deleteRecordedDateBtn"
            onClick={onOpenDeleteRecordedDateModal}
            title="Permanently delete this selected recorded date period"
            className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-300 hover:border-red-600 rounded flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CalendarX className="w-3.5 h-3.5" />
            <span>Delete Recorded Date</span>
          </button>

          <button
            type="button"
            id="newSiteBtn"
            onClick={onOpenCreateSiteModal}
            className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-700 border border-emerald-300 hover:border-emerald-700 rounded flex items-center gap-1 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Site</span>
          </button>

          <button
            type="button"
            id="clearRecordsBtn"
            onClick={onOpenClearRecordsModal}
            className="px-2.5 py-1.5 text-xs font-bold text-orange-700 hover:text-white bg-orange-50 hover:bg-orange-600 border border-orange-300 hover:border-orange-600 rounded flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>{isViewAll ? 'Clear All' : 'Clear Records'}</span>
          </button>

          {!isViewAll && (
            <button
              type="button"
              id="deleteSiteBtn"
              onClick={onOpenDeleteSiteModal}
              className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-700 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Site</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
