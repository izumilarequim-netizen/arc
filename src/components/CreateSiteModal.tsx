import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSite: (name: string) => void;
}

export const CreateSiteModal: React.FC<CreateSiteModalProps> = ({
  isOpen,
  onClose,
  onCreateSite,
}) => {
  const [siteName, setSiteName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      alert('Please enter a valid project location name.');
      return;
    }
    onCreateSite(siteName.trim().toUpperCase());
    setSiteName('');
    onClose();
  };

  return (
    <div
      id="createProjectModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        <div className="bg-[#0d0d0d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#d11a2a]" />
            <span>Create New Project Location</span>
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
              Project / Location Name
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. CABANATUAN SITE"
              className="w-full px-3 py-2 text-xs uppercase font-bold border border-gray-300 rounded focus:outline-none focus:border-[#d11a2a]"
              autoFocus
            />
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
