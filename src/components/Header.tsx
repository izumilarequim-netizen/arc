import React from 'react';
import { Calendar, MapPin, FileText, Download } from 'lucide-react';
import { TimesheetDB } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentDate: string;
  currentLocation: string;
  locationsList: string[];
  timesheetDB: TimesheetDB;
  onDateChange: (newDate: string) => void;
  onLocationChange: (newLoc: string) => void;
  onOpenExportModal: () => void;
  onOpenExportPdfModal: () => void;
  onOpenAndroidModal: () => void;
  hasRecordForDate: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  currentLocation,
  locationsList,
  timesheetDB,
  onDateChange,
  onLocationChange,
  onOpenExportModal,
  onOpenExportPdfModal,
  onOpenAndroidModal,
  hasRecordForDate,
}) => {
  const currentDayData = timesheetDB[currentDate];

  return (
    <header
      id="headerCard"
      className="bg-[#0d0d0d] text-white border-b-4 border-[#d11a2a] rounded-xl p-5 mb-5 shadow-lg"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Brand Section */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
              ARCDESIGN
            </h1>
            <button
              type="button"
              onClick={onOpenAndroidModal}
              title="Android PWA Ready - Click for install guide & features"
              className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              Android Ready
            </button>
          </div>
          <div className="text-xs font-bold text-[#d11a2a] tracking-[6px] uppercase mt-1">
            CONSTRUCTION
          </div>
          <p className="text-gray-400 text-xs mt-1">Timesheet & Attendance Tracker</p>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 no-print">
          {/* Week Start Date */}
          <div className="flex flex-col">
            <label
              htmlFor="startDatePicker"
              className="text-xs font-bold text-white mb-1 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-[#d11a2a]" />
              <span>Select Week Start Date:</span>
            </label>
            <input
              type="date"
              id="startDatePicker"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded border focus:outline-none transition-colors ${
                hasRecordForDate
                  ? 'bg-emerald-700 text-white border-emerald-600'
                  : 'bg-white text-gray-900 border-red-500'
              }`}
            />
          </div>

          {/* Location Selector */}
          <div className="flex flex-col">
            <label
              htmlFor="locationSelector"
              className="text-xs font-bold text-white mb-1 flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#d11a2a]" />
              <span>Location:</span>
            </label>
            <select
              id="locationSelector"
              value={currentLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white text-gray-900 rounded border border-red-500 focus:outline-none cursor-pointer"
            >
              {locationsList.map((loc) => {
                const isDone = currentDayData?.locations[loc]?.isDone;
                return (
                  <option key={loc} value={loc}>
                    {isDone ? `✔ ${loc} [DONE]` : loc}
                  </option>
                );
              })}
              <option value="VIEW_ALL">🌐 -- VIEW ALL LOCATIONS --</option>
            </select>
          </div>

          {/* Action Buttons: Android Install + Export Actions */}
          <div className="flex items-end flex-wrap sm:flex-nowrap gap-2">
            <PWAInstallButton onOpenGuide={onOpenAndroidModal} />

            <button
              id="exportTxtButton"
              type="button"
              onClick={onOpenExportModal}
              className="w-full sm:w-auto h-[34px] px-3.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-neutral-950" />
              <span>Export TXT</span>
            </button>

            <button
              id="exportPdfButton"
              type="button"
              onClick={onOpenExportPdfModal}
              className="w-full sm:w-auto h-[34px] px-3.5 bg-[#d11a2a] hover:bg-red-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
