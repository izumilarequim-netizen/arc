import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';
import { authenticateUser, CURRENT_USER_SESSION_KEY } from '../utils/auth';

interface LoginOverlayProps {
  isOpen: boolean;
  onLoginSuccess: (account: UserAccount) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const account = authenticateUser(username, password);
    if (account) {
      sessionStorage.setItem('arcdesign_logged_in', 'true');
      sessionStorage.setItem(
        CURRENT_USER_SESSION_KEY,
        JSON.stringify({
          username: account.username,
          role: account.role,
        })
      );
      setHasError(false);
      onLoginSuccess(account);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      id="loginOverlay"
      className="fixed inset-0 bg-[#0d0d0d]/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-[#18181b] border-2 border-[#d11a2a] rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white">
        <div className="text-center mb-6">
          <div className="text-3xl font-black tracking-tight text-white uppercase">ARCDESIGN</div>
          <div className="text-xs font-bold text-[#d11a2a] tracking-[6px] uppercase mt-1">CONSTRUCTION</div>
          <p className="text-gray-400 text-xs mt-3">System Authentication Required</p>
        </div>

        {hasError && (
          <div
            id="loginErrorAlert"
            className="mb-4 p-3 bg-red-950/80 border border-red-500 rounded-md text-red-200 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Invalid Username or Password!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="loginUsername"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (hasError) setHasError(false);
                }}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="loginPassword"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (hasError) setHasError(false);
                }}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
              />
            </div>
          </div>

          <button
            id="loginSubmitButton"
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-[#d11a2a] hover:bg-[#b01321] text-white font-bold rounded-md transition-colors text-sm shadow-md uppercase tracking-wider cursor-pointer"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-gray-500">Authorized personnel only. Sessions are saved locally.</span>
        </div>
      </div>
    </div>
  );
};
