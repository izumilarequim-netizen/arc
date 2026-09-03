import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  KeyRound,
  Users
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  getStoredAccounts,
  createStaffAccount,
  deleteStaffAccount,
} from '../utils/auth';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accountsList, setAccountsList] = useState<UserAccount[]>(() =>
    getStoredAccounts()
  );

  if (!isOpen) return null;

  const refreshAccounts = () => {
    setAccountsList(getStoredAccounts());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    const res = createStaffAccount(username, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create account.');
      return;
    }

    setSuccessMessage(`Staff account "${username.trim()}" created successfully!`);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    refreshAccounts();
  };

  const handleDeleteStaff = (staffUsername: string) => {
    if (window.confirm(`Are you sure you want to remove staff account "${staffUsername}"?`)) {
      deleteStaffAccount(staffUsername);
      refreshAccounts();
      setSuccessMessage(`Staff account "${staffUsername}" deleted.`);
    }
  };

  const staffAccounts = accountsList.filter((acc) => acc.role === 'staff');

  return (
    <div
      id="createAccountModal"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#0d0d0d] text-white p-4 flex items-center justify-between border-b-2 border-b-[#d11a2a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d11a2a] flex items-center justify-center text-white shadow-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide uppercase">Create Staff Account</h3>
              <p className="text-[11px] text-gray-400">Admin Account Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Admin Notice Banner */}
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#d11a2a] shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-700">
              <span className="font-bold text-neutral-900 block">Role Assignment: Staff</span>
              Newly created accounts are designated as <strong className="text-[#d11a2a]">Staff</strong>. Staff members can access and manage timesheets but cannot create or manage user accounts.
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div
              id="createAccountError"
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              id="createAccountSuccess"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Account Creation Form */}
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Staff Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="newStaffUsername"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. staff_alex"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="newStaffPassword"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Min 4 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="newStaffConfirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>
            </div>

            {/* Role indicator */}
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-xs font-bold text-gray-600">Assigned Account Role:</span>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded text-xs font-black uppercase tracking-wider">
                Staff
              </span>
            </div>

            <button
              id="submitCreateAccountBtn"
              type="submit"
              className="w-full py-2.5 px-4 bg-[#d11a2a] hover:bg-[#b01321] text-white font-bold rounded-md transition-colors text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          </form>

          {/* Registered Accounts Section */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span>Existing Staff Accounts ({staffAccounts.length})</span>
              </span>
            </div>

            {staffAccounts.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded border border-gray-200 text-center">
                No staff accounts created yet. Use the form above to add staff credentials.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {staffAccounts.map((acc) => (
                  <div
                    key={acc.username}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black text-[11px]">
                        S
                      </div>
                      <div>
                        <span className="font-bold text-gray-900">{acc.username}</span>
                        <span className="ml-2 px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200 uppercase">
                          Staff
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(acc.username)}
                      title={`Remove account ${acc.username}`}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
