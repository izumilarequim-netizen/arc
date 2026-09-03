import React, { useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  Clock,
  Coins,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { LocationData, WorkerItem } from '../types';
import { DAY_KEYS } from '../data/initialData';
import { getAutomatedSiteRemark } from '../utils/calculations';

interface OverallAnalyticsProps {
  locations: Record<string, LocationData>;
  roleBales?: Record<string, number>;
  selectedRoles: string[];
  currentDate: string;
  onSelectLocation?: (locName: string) => void;
}

export const OverallAnalytics: React.FC<OverallAnalyticsProps> = ({
  locations,
  roleBales = {},
  selectedRoles,
  onSelectLocation,
}) => {
  // Aggregate statistics across all sites
  const stats = useMemo(() => {
    const locationEntries = Object.entries(locations) as [string, LocationData][];
    
    let totalFull = 0;
    let totalHalf = 0;
    let totalHourly = 0;
    let totalAbsent = 0;
    let totalSick = 0;
    let totalEmergency = 0;
    let totalOverallOT = 0;
    let totalOverallShifts = 0;
    let totalLocationBale = 0;
    let totalWorkersCount = 0;
    let doneSitesCount = 0;

    const siteStatsList: Array<{
      name: string;
      isDone: boolean;
      workerCount: number;
      full: number;
      half: number;
      hourly: number;
      absent: number;
      sick: number;
      emergency: number;
      otHours: number;
      totalShifts: number;
      attRate: number;
      bale: number;
      remarksCount: number;
    }> = [];

    const roleMap: Record<
      string,
      { count: number; full: number; half: number; absent: number; ot: number }
    > = {};

    const allRemarks: Array<{
      id: string;
      siteName: string;
      text: string;
      timestamp: string;
    }> = [];

    locationEntries.forEach(([locName, locData]) => {
      if (!locData) return;
      if (locData.isDone) doneSitesCount++;
      totalLocationBale += locData.baleValue || 0;

      // Collect remarks
      if (locData.siteRemarksHistory) {
        locData.siteRemarksHistory.forEach((r) => {
          allRemarks.push({
            id: r.id,
            siteName: locName,
            text: r.text,
            timestamp: r.timestamp || r.date || '',
          });
        });
      }

      let workers: WorkerItem[] = locData.workers || [];
      if (selectedRoles.length > 0) {
        workers = workers.filter((w) => selectedRoles.includes(w.role));
      }

      totalWorkersCount += workers.length;

      let sFull = 0;
      let sHalf = 0;
      let sHourly = 0;
      let sAbsent = 0;
      let sSick = 0;
      let sEmergency = 0;
      let sOT = 0;
      let sShifts = 0;

      workers.forEach((w) => {
        // Track by role
        if (!roleMap[w.role]) {
          roleMap[w.role] = { count: 0, full: 0, half: 0, absent: 0, ot: 0 };
        }
        roleMap[w.role].count++;

        DAY_KEYS.forEach((k) => {
          const val = w.attendance[k] || '';
          const isFullOrHalf = val === '1.0' || val === '0.5';
          const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;

          if (val === '1.0') {
            sFull++;
            sShifts++;
            totalFull++;
            totalOverallShifts++;
            roleMap[w.role].full++;
          } else if (val === '0.5') {
            sHalf++;
            sShifts++;
            totalHalf++;
            totalOverallShifts++;
            roleMap[w.role].half++;
          } else if (val === '1h' || val === '2h') {
            sHourly++;
            sShifts++;
            totalHourly++;
            totalOverallShifts++;
          } else if (val === 'absent') {
            sAbsent++;
            sShifts++;
            totalAbsent++;
            totalOverallShifts++;
            roleMap[w.role].absent++;
          } else if (val === 'sick') {
            sSick++;
            sShifts++;
            totalSick++;
            totalOverallShifts++;
          } else if (val === 'emergency') {
            sEmergency++;
            sShifts++;
            totalEmergency++;
            totalOverallShifts++;
          }

          sOT += ot;
          totalOverallOT += ot;
          roleMap[w.role].ot += ot;
        });
      });

      const sAttRate = sShifts > 0 ? Math.round(((sFull + sHalf * 0.5) / sShifts) * 100) : 0;

      siteStatsList.push({
        name: locName,
        isDone: Boolean(locData.isDone),
        workerCount: workers.length,
        full: sFull,
        half: sHalf,
        hourly: sHourly,
        absent: sAbsent,
        sick: sSick,
        emergency: sEmergency,
        otHours: sOT,
        totalShifts: sShifts,
        attRate: sAttRate,
        bale: locData.baleValue || 0,
        remarksCount: (locData.siteRemarksHistory || []).length,
      });
    });

    // Total Role Bales
    let totalRoleBale = 0;
    Object.values(roleBales).forEach((val) => {
      totalRoleBale += parseFloat(String(val)) || 0;
    });

    const grandTotalBale = totalLocationBale + totalRoleBale;

    const fullPct = totalOverallShifts
      ? Math.round((totalFull / totalOverallShifts) * 100)
      : 0;
    const halfPct = totalOverallShifts
      ? Math.round((totalHalf / totalOverallShifts) * 100)
      : 0;
    const hourlyPct = totalOverallShifts
      ? Math.round((totalHourly / totalOverallShifts) * 100)
      : 0;
    const absentPct = totalOverallShifts
      ? Math.round((totalAbsent / totalOverallShifts) * 100)
      : 0;
    const sickPct = totalOverallShifts
      ? Math.round((totalSick / totalOverallShifts) * 100)
      : 0;
    const emergencyPct = totalOverallShifts
      ? Math.round((totalEmergency / totalOverallShifts) * 100)
      : 0;

    const overallAttendanceRate = totalOverallShifts
      ? Math.round(((totalFull + totalHalf * 0.5) / totalOverallShifts) * 100)
      : 0;

    const autoRemark = getAutomatedSiteRemark(
      fullPct,
      halfPct,
      absentPct,
      totalOverallShifts
    );

    return {
      totalSites: locationEntries.length,
      doneSitesCount,
      activeSitesCount: locationEntries.length - doneSitesCount,
      totalWorkersCount,
      totalFull,
      totalHalf,
      totalHourly,
      totalAbsent,
      totalSick,
      totalEmergency,
      totalOverallOT,
      totalOverallShifts,
      totalLocationBale,
      totalRoleBale,
      grandTotalBale,
      fullPct,
      halfPct,
      hourlyPct,
      absentPct,
      sickPct,
      emergencyPct,
      overallAttendanceRate,
      autoRemark,
      siteStatsList,
      roleMap,
      allRemarks: allRemarks.slice(-8).reverse(),
    };
  }, [locations, roleBales, selectedRoles]);

  // Conic gradient calculations
  const degFull = (stats.fullPct / 100) * 360;
  const degHalf = degFull + (stats.halfPct / 100) * 360;
  const degHourly = degHalf + (stats.hourlyPct / 100) * 360;
  const degSick = degHourly + (stats.sickPct / 100) * 360;
  const degAbsent = degSick + (stats.absentPct / 100) * 360;

  const conicStyle =
    stats.totalOverallShifts > 0
      ? {
          background: `conic-gradient(#198754 0deg ${degFull}deg, #ffc107 ${degFull}deg ${degHalf}deg, #6c757d ${degHalf}deg ${degHourly}deg, #0dcaf0 ${degHourly}deg ${degSick}deg, #dc3545 ${degSick}deg ${degAbsent}deg, #6f42c1 ${degAbsent}deg 360deg)`,
        }
      : { background: '#e9ecef' };

  return (
    <section
      id="overallStatsContainer"
      className="bg-white border border-gray-200 border-l-4 border-l-[#d11a2a] rounded-xl p-4 sm:p-5 mb-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
            <PieChartIcon className="w-4 h-4 text-[#d11a2a]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <span>OVERALL MASTER ANALYTICS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#d11a2a] text-white font-bold">
                ALL LOCATIONS
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Consolidated attendance performance across {stats.totalSites} project sites
              {selectedRoles.length > 0 && ` (Filtered: ${selectedRoles.join(', ')})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-md border border-neutral-200 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-600" />
            <span>{stats.activeSitesCount} Active / {stats.doneSitesCount} Done</span>
          </span>
          <span className="px-2.5 py-1 bg-red-50 text-[#d11a2a] rounded-md border border-red-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{stats.totalWorkersCount} Total Workers</span>
          </span>
        </div>
      </div>

      {/* Executive Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1">
            <span>TOTAL SHIFTS</span>
            <Building2 className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 leading-tight">
            {stats.totalOverallShifts}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1">
            {stats.overallAttendanceRate}% Effective Attendance
          </div>
        </div>

        <div className="p-3 bg-red-50/70 rounded-lg border border-red-200">
          <div className="flex items-center justify-between text-xs font-bold text-red-900 mb-1">
            <span>OVERALL OVERTIME</span>
            <Clock className="w-4 h-4 text-[#d11a2a]" />
          </div>
          <div className="text-2xl font-black text-[#d11a2a] leading-tight">
            {stats.totalOverallOT} <span className="text-sm font-bold">Hours</span>
          </div>
          <div className="text-[11px] font-semibold text-red-700 mt-1">
            Logged across all project sites
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
            <span>TOTAL BALE ADVANCES</span>
            <Coins className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-950 leading-tight">
            ₱{stats.grandTotalBale.toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-amber-800 mt-1 flex items-center justify-between">
            <span>Sites: ₱{stats.totalLocationBale.toLocaleString()}</span>
            {stats.totalRoleBale > 0 && (
              <span>Roles: ₱{stats.totalRoleBale.toLocaleString()}</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
            <span>FULL ATTENDANCE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-950 leading-tight">
            {stats.totalFull} <span className="text-sm font-bold">({stats.fullPct}%)</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-800 mt-1">
            + {stats.totalHalf} Half Days ({stats.halfPct}%)
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Donut + Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-center">
        {/* Pie/Donut Chart */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-gray-200">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Company Shift Distribution
          </span>

          <div
            className="w-36 h-36 rounded-full flex items-center justify-center shadow-md relative"
            style={conicStyle}
          >
            <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-gray-900 leading-none">
                {stats.totalOverallShifts}
              </span>
              <span className="text-[10px] font-bold text-gray-500 mt-0.5">TOTAL LOGGED</span>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-1.5 mt-3 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
              Full ({stats.fullPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-gray-900">
              Half ({stats.halfPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-500 text-white">
              Hr ({stats.hourlyPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-400 text-cyan-950">
              Sick ({stats.sickPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white">
              Abs ({stats.absentPct}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-700 text-white">
              Emg ({stats.emergencyPct}%)
            </span>
          </div>
        </div>

        {/* 6 Category Stat Cards */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between h-full">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div className="p-2 text-center rounded-lg bg-emerald-50 border border-emerald-300">
              <span className="text-[10px] font-bold text-emerald-800 block">FULL</span>
              <span className="text-lg font-black text-emerald-950 block">{stats.totalFull}</span>
              <span className="text-[10px] font-semibold text-emerald-700">{stats.fullPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-amber-50 border border-amber-300">
              <span className="text-[10px] font-bold text-amber-800 block">HALF</span>
              <span className="text-lg font-black text-amber-950 block">{stats.totalHalf}</span>
              <span className="text-[10px] font-semibold text-amber-700">{stats.halfPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-gray-100 border border-gray-300">
              <span className="text-[10px] font-bold text-gray-700 block">HOURLY</span>
              <span className="text-lg font-black text-gray-900 block">{stats.totalHourly}</span>
              <span className="text-[10px] font-semibold text-gray-600">{stats.hourlyPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-cyan-50 border border-cyan-300">
              <span className="text-[10px] font-bold text-cyan-800 block">SICK</span>
              <span className="text-lg font-black text-cyan-950 block">{stats.totalSick}</span>
              <span className="text-[10px] font-semibold text-cyan-700">{stats.sickPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-rose-50 border border-rose-300">
              <span className="text-[10px] font-bold text-rose-800 block">ABSENT</span>
              <span className="text-lg font-black text-rose-950 block">{stats.totalAbsent}</span>
              <span className="text-[10px] font-semibold text-rose-700">{stats.absentPct}%</span>
            </div>

            <div className="p-2 text-center rounded-lg bg-purple-50 border border-purple-300">
              <span className="text-[10px] font-bold text-purple-800 block">EMERGENCY</span>
              <span className="text-lg font-black text-purple-950 block">
                {stats.totalEmergency}
              </span>
              <span className="text-[10px] font-semibold text-purple-700">
                {stats.emergencyPct}%
              </span>
            </div>
          </div>

          {/* Automated Overall Result */}
          <div className="mt-4 p-3 bg-neutral-100 rounded-lg border border-neutral-300 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <MessageSquare className="w-4 h-4 text-[#d11a2a]" />
              <span>COMPANY ATTENDANCE REMARK (AUTOMATED RESULT):</span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                stats.autoRemark.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : stats.autoRemark.type === 'danger'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : stats.autoRemark.type === 'warning'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {stats.autoRemark.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {stats.autoRemark.type === 'danger' && <AlertTriangle className="w-3 h-3" />}
              {stats.autoRemark.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {stats.autoRemark.type === 'info' && <Info className="w-3 h-3" />}
              <span>{stats.autoRemark.text}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Site-by-Site Comparison Matrix */}
      <div className="border-t border-gray-200 pt-4 mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Building2 className="w-3.5 h-3.5 text-[#d11a2a]" />
            <span>SITE-BY-SITE PERFORMANCE COMPARISON</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Click any location to jump to its individual timesheet
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-800 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="p-2.5">Project Location</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-center">Workers</th>
                <th className="p-2.5 text-center">Full Days</th>
                <th className="p-2.5 text-center">Half Days</th>
                <th className="p-2.5 text-center">Absents</th>
                <th className="p-2.5 text-center">Total OT</th>
                <th className="p-2.5 text-center">Attendance Rate</th>
                <th className="p-2.5 text-right">Site Bale (₱)</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.siteStatsList.map((s) => (
                <tr key={s.name} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-2.5 font-bold text-gray-900 flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.remarksCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        {s.remarksCount} notes
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    {s.isDone ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                        DONE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-semibold text-[10px]">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-gray-800">{s.workerCount}</td>
                  <td className="p-2.5 text-center text-emerald-800 font-bold">{s.full}</td>
                  <td className="p-2.5 text-center text-amber-800 font-bold">{s.half}</td>
                  <td className="p-2.5 text-center text-rose-800 font-bold">{s.absent}</td>
                  <td className="p-2.5 text-center">
                    {s.otHours > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#d11a2a] text-white font-bold text-[10px]">
                        {s.otHours}h
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">0h</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full ${
                            s.attRate >= 80
                              ? 'bg-emerald-500'
                              : s.attRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${s.attRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] w-8">{s.attRate}%</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-black text-red-700">
                    ₱{s.bale.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-center">
                    {onSelectLocation && (
                      <button
                        type="button"
                        onClick={() => onSelectLocation(s.name)}
                        className="px-2 py-1 bg-neutral-800 hover:bg-[#d11a2a] text-white rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade & Role Deployment Distribution */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-3">
          <Briefcase className="w-3.5 h-3.5 text-[#d11a2a]" />
          <span>WORKFORCE DEPLOYMENT BY TRADE / ROLE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {(
            Object.entries(stats.roleMap) as [
              string,
              { count: number; full: number; half: number; absent: number; ot: number }
            ][]
          ).map(([role, rData]) => (
            <div
              key={role}
              className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-black text-xs text-gray-900 truncate">{role}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-white">
                    {rData.count}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 font-medium space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-semibold">Full: {rData.full}</span>
                    <span className="text-amber-700 font-semibold">Half: {rData.half}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-700 font-semibold">Abs: {rData.absent}</span>
                    <span className="text-red-700 font-bold">OT: {rData.ot}h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Site Announcements / Remarks Feed if any */}
      {stats.allRemarks.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-2.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#d11a2a]" />
            <span>CROSS-SITE RECENT ANNOUNCEMENTS & REMARKS</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {stats.allRemarks.map((r) => (
              <div
                key={r.id}
                className="bg-amber-50 border border-amber-200 p-2 rounded flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-[#d11a2a] text-white rounded text-[10px] font-bold uppercase">
                    {r.siteName}
                  </span>
                  {r.timestamp && (
                    <span className="px-1.5 py-0.5 bg-neutral-800 text-white rounded text-[9px] font-bold">
                      {r.timestamp}
                    </span>
                  )}
                  <span className="font-semibold text-gray-800">{r.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
