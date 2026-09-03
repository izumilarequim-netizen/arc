import React from 'react';
import { UserCircle2, LogOut, UserPlus, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types';

interface FooterBarProps {
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenCreateAccount: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  currentUser,
  onLogout,
  onOpenCreateAccount,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const username = currentUser?.username || 'Admin';

  return (
    <footer
      id="footerAccountBar"
      className="bg-[#0d0d0d] text-white border-t-4 border-t-[#d11a2a] rounded-xl p-4 mt-6 shadow-md no-print"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <UserCircle2 className="w-6 h-6 text-[#d11a2a]" />
          <div>
            <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider">
              Logged In Account:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2.5 py-0.5 text-xs font-black rounded uppercase tracking-wider ${
                  isAdmin ? 'bg-[#d11a2a] text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isAdmin ? 'Administrator' : 'Staff'} ({username})
              </span>
              {!isAdmin && (
                <span className="text-[11px] text-gray-400 font-medium italic">
                  Standard Access
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Create Account button: ONLY visible when Admin is logged in */}
          {isAdmin && (
            <button
              id="createAccountButton"
              type="button"
              onClick={onOpenCreateAccount}
              className="px-3.5 py-1.5 bg-[#d11a2a] hover:bg-[#b01321] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          )}

          <button
            id="logoutButton"
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 border border-neutral-600 hover:border-white text-gray-200 hover:text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#d11a2a]" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
