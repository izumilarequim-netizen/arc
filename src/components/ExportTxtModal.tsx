import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, XCircle, X } from 'lucide-react';
import { TimesheetDB } from '../types';
import { DAY_KEYS } from '../data/initialData';
import { generateMathChallenge } from '../utils/calculations';

interface ExportTxtModalProps {
  isOpen: boolean;
  currentDate: string;
  timesheetDB: TimesheetDB;
  onClose: () => void;
}

export const ExportTxtModal: React.FC<ExportTxtModalProps> = ({
  isOpen,
  currentDate,
  timesheetDB,
  onClose,
}) => {
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [challenge, setChallenge] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStartDate(currentDate);
      setEndDate(currentDate);
      setChallenge(generateMathChallenge());
      setUserAnswer('');
      setHasError(false);
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed) || parsed !== challenge.answer) {
      setHasError(true);
      return;
    }

    let transcript = `=======================================================\n`;
    transcript += ` ARCDESIGN CONSTRUCTION - TIMESHEET TRANSCRIPT \n`;
    transcript += `=======================================================\n`;
    transcript += `Export Period Range: ${startDate} to ${endDate}\n`;
    transcript += `Generated On: ${new Date().toLocaleString()}\n`;
    transcript += `=======================================================\n\n`;

    let totalOverallDays = 0;
    let totalOverallOT = 0;
    let totalOverallBale = 0;
    const locationsWithBale: { loc: string; bale: number; date: string }[] = [];

    const sortedDateKeys = Object.keys(timesheetDB).sort();

    for (const dKey of sortedDateKeys) {
      if (dKey >= startDate && dKey <= endDate) {
        const dayObj = timesheetDB[dKey];
        transcript += `--- WEEK / RECORD PERIOD: ${dKey} ---\n`;
        if (dayObj?.locations) {
          for (const loc in dayObj.locations) {
            const locData = dayObj.locations[loc];
            const locBale = locData.baleValue || 0;

            if (locBale > 0) {
              totalOverallBale += locBale;
              locationsWithBale.push({ loc, bale: locBale, date: dKey });
              transcript += `\nLOCATION: ${loc}  [ Site Bale: ₱${locBale.toLocaleString()} ]\n`;
            } else {
              transcript += `\nLOCATION: ${loc}\n`;
            }
            transcript += `-------------------------------------------------------\n`;

            if (locData.workers && locData.workers.length > 0) {
              locData.workers.forEach((w) => {
                let wDays = 0;
                let wOT = 0;
                const attLog: string[] = [];

                DAY_KEYS.forEach((k) => {
                  const val = w.attendance[k] || '-';
                  const isFullOrHalf = val === '1.0' || val === '0.5';
                  const ot = isFullOrHalf ? (parseFloat(String(w.ot[k])) || 0) : 0;
                  if (val === '1.0') wDays += 1.0;
                  else if (val === '0.5') wDays += 0.5;

                  const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
                  wOT += ot + attHours;
                  attLog.push(`${k}: ${val}${ot > 0 && isFullOrHalf ? ` (${ot}h OT)` : ''}`);
                });

                totalOverallDays += wDays;
                totalOverallOT += wOT;

                const workerBale = w.baleValue || 0;
                if (workerBale > 0) {
                  totalOverallBale += workerBale;
                }
                const baleStr = workerBale > 0 ? ` | Bale: ₱${workerBale.toLocaleString()}` : '';

                transcript += `  Worker: ${w.name.padEnd(24)} | Role: ${w.role.padEnd(10)} | Days: ${wDays.toFixed(1)} | OT/Extra: ${wOT}h${baleStr}\n`;
                transcript += `  Daily Breakdown: [ ${attLog.join('  |  ')} ]\n\n`;
              });
            } else {
              transcript += `  (No workers recorded)\n\n`;
            }
          }
        }

        // Include any recorded Role Bales if they have value
        if (dayObj?.roleBales) {
          const activeRoleBales = Object.entries(dayObj.roleBales).filter(([_, val]) => (parseFloat(String(val)) || 0) > 0);
          if (activeRoleBales.length > 0) {
            transcript += `ROLE BALE CASH ADVANCES (${dKey}):\n`;
            activeRoleBales.forEach(([roleName, val]) => {
              const bVal = parseFloat(String(val)) || 0;
              totalOverallBale += bVal;
              transcript += `  - ${roleName}: ₱${bVal.toLocaleString()}\n`;
            });
            transcript += `\n`;
          }
        }

        transcript += `=======================================================\n\n`;
      }
    }

    transcript += `\nTRANSCRIPT SUMMARY TOTALS:\n`;
    transcript += `Total Days Worked: ${totalOverallDays.toFixed(1)} Days\n`;
    transcript += `Total Overtime/Extra Hours: ${totalOverallOT} Hours\n`;
    if (totalOverallBale > 0) {
      transcript += `Total Cash Advances (Bale): ₱${totalOverallBale.toLocaleString()}\n`;
      if (locationsWithBale.length > 0) {
        transcript += `Locations with Bale Recorded:\n`;
        locationsWithBale.forEach((item) => {
          transcript += `  * ${item.loc} (${item.date}): ₱${item.bale.toLocaleString()}\n`;
        });
      }
    }
    transcript += `=======================================================\n`;

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ARCDESIGN_Timesheet_Transcript_${startDate}_to_${endDate}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);

    onClose();
  };

  return (
    <div
      id="exportTxtModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-[#d11a2a]">
        <div className="bg-[#0d0d0d] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#d11a2a]" />
            <span>Export Records Transcript (.TXT)</span>
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDownload} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">
              Select Period Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded font-semibold text-xs focus:outline-none focus:border-[#d11a2a]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">
              Select Period End Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded font-semibold text-xs focus:outline-none focus:border-[#d11a2a]"
            />
          </div>

          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Security Verification Math Challenge</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-red-600">{challenge.question}</span>
              <span className="text-lg font-bold text-gray-700">=</span>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  if (hasError) setHasError(false);
                }}
                placeholder="Answer"
                className="w-24 px-2.5 py-1 text-sm font-bold border border-red-400 rounded focus:outline-none"
                autoFocus
              />
            </div>

            {hasError && (
              <div className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Incorrect answer. Please try again.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Transcript</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
