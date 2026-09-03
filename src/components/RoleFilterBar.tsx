import React from 'react';
import { Filter, Search, UserPlus } from 'lucide-react';
import { ALL_ROLES } from '../data/initialData';

interface RoleFilterBarProps {
  selectedRoles: string[];
  onToggleRole: (role: string) => void;
  onOpenSearchWorkerModal: () => void;
  onOpenAddWorkerModal: () => void;
  isViewAll: boolean;
}

export const RoleFilterBar: React.FC<RoleFilterBarProps> = ({
  selectedRoles,
  onToggleRole,
  onOpenSearchWorkerModal,
  onOpenAddWorkerModal,
  isViewAll,
}) => {
  return (
    <div
      id="roleFilterBar"
      className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between flex-wrap gap-2.5 no-print"
    >
      {/* Role Filters */}
      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-[#d11a2a]" />
          <span>Filter Roles:</span>
        </span>

        <button
          type="button"
          onClick={() => onToggleRole('ALL')}
          className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors border cursor-pointer ${
            selectedRoles.length === 0
              ? 'bg-[#d11a2a] text-white border-[#d11a2a]'
              : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
          }`}
        >
          SHOW ALL
        </button>

        {ALL_ROLES.map((role) => {
          const isSelected = selectedRoles.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => onToggleRole(role)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-[#d11a2a] text-white border-[#d11a2a]'
                  : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="searchWorkerBtn"
          onClick={onOpenSearchWorkerModal}
          className="text-xs font-bold px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#d11a2a]" />
          <span>Search Worker</span>
        </button>

        <button
          type="button"
          id="addWorkerBtn"
          onClick={onOpenAddWorkerModal}
          disabled={isViewAll}
          title={isViewAll ? "Select a specific site to add worker" : "Add worker to current site"}
          className={`text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm ${
            isViewAll
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#d11a2a] hover:bg-[#b01321] text-white cursor-pointer'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Worker</span>
        </button>
      </div>
    </div>
  );
};
