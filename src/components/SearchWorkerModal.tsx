import React, { useState } from 'react';
import { Search, X, User, MapPin, ArrowRight } from 'lucide-react';
import { TimesheetDayData, WorkerItem, LocationData } from '../types';
import { levDistance, getWorkerMetrics } from '../utils/calculations';

interface SearchWorkerModalProps {
  isOpen: boolean;
  currentDayData: TimesheetDayData | undefined;
  onClose: () => void;
  onSelectWorker: (workerId: string, workerName: string) => void;
}

interface WorkerMatch {
  worker: WorkerItem;
  location: string;
}

export const SearchWorkerModal: React.FC<SearchWorkerModalProps> = ({
  isOpen,
  currentDayData,
  onClose,
  onSelectWorker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<WorkerMatch[]>([]);

  if (!isOpen) return null;

  // Build worker names list for suggestions
  const workerNamesList: string[] = [];
  if (currentDayData?.locations) {
    const set = new Set<string>();
    Object.values(currentDayData.locations).forEach((loc: LocationData) => {
      loc.workers?.forEach((w) => {
        if (w.name) set.add(w.name);
      });
    });
    workerNamesList.push(...Array.from(set).sort());
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    setHasSearched(true);

    if (!query || !currentDayData?.locations) {
      setResults([]);
      return;
    }

    const matches: WorkerMatch[] = [];

    for (const loc in currentDayData.locations) {
      const locData = currentDayData.locations[loc];
      if (!locData?.workers) continue;

      locData.workers.forEach((w) => {
        const nameUpper = w.name.toUpperCase();
        let isMatch = false;

        if (nameUpper.includes(query)) {
          isMatch = true;
        } else {
          const words = nameUpper.split(' ');
          const qWords = query.split(' ');
          for (const qw of qWords) {
            for (const wWord of words) {
              if (levDistance(qw, wWord) <= 2) {
                isMatch = true;
                break;
              }
            }
          }
        }

        if (isMatch) {
          matches.push({ worker: w, location: loc });
        }
      });
    }

    setResults(matches);
  };

  return (
    <div
      id="searchWorkerModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="bg-[#0d0d0d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 uppercase">
            <Search className="w-5 h-5 text-[#d11a2a]" />
            <span>Search Worker Logs</span>
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch}>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Enter Worker Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                list="workerSuggestionsList"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. WILLY MANIBIN or WILLY MABINI"
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded uppercase font-bold focus:outline-none focus:border-[#d11a2a]"
                autoFocus
              />
              <datalist id="workerSuggestionsList">
                {workerNamesList.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <button
                type="submit"
                className="px-4 py-2 bg-[#d11a2a] hover:bg-[#b01321] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Results Area */}
          <div>
            {hasSearched && results.length === 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center text-xs font-bold text-red-800">
                No workers found matching "{searchQuery}".
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600 block mb-1">
                  Found {results.length} matching worker record(s):
                </span>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {results.map(({ worker, location }) => {
                    const metrics = getWorkerMetrics(worker);
                    return (
                      <button
                        key={`${location}_${worker.id}`}
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectWorker(worker.id, worker.name);
                        }}
                        className="w-full text-left p-3.5 rounded-lg border border-gray-300 hover:border-[#d11a2a] hover:shadow-md transition-all bg-white flex flex-col gap-1.5 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm uppercase text-[#d11a2a] flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            <span>{worker.name}</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-900 text-white rounded">
                            {worker.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-gray-800 rounded font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#d11a2a]" /> Site: {location}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                            {metrics.full} Full Days (Current Week)
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-gray-500 group-hover:text-neutral-900 flex items-center gap-1 mt-1 transition-colors">
                          <span>Click to view dedicated individual worker profile, weekly breakdown & overall history</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#d11a2a]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
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
