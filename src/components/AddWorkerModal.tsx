import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { ALL_ROLES } from '../data/initialData';

interface AddWorkerModalProps {
  isOpen: boolean;
  currentLocation: string;
  onClose: () => void;
  onAddWorker: (name: string, role: string) => void;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  currentLocation,
  onClose,
  onAddWorker,
}) => {
  const [workerName, setWorkerName] = useState('');
  const [role, setRole] = useState('FOREMAN');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      alert('Please enter worker name.');
      return;
    }
    onAddWorker(workerName.trim().toUpperCase(), role);
    setWorkerName('');
    setRole('FOREMAN');
    onClose();
  };

  return (
    <div
      id="addWorkerModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        <div className="bg-[#0d0d0d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#d11a2a]" />
            <span>
              Add Worker to <span className="text-[#d11a2a]">{currentLocation}</span>
            </span>
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Worker Name
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="e.g. JUAN DELA CRUZ"
              className="w-full px-3 py-2 text-xs uppercase font-bold border border-gray-300 rounded focus:outline-none focus:border-[#d11a2a]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded focus:outline-none focus:border-[#d11a2a] cursor-pointer"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#d11a2a] hover:bg-[#b01321] text-white font-bold rounded text-xs transition-colors cursor-pointer"
            >
              Add Worker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
