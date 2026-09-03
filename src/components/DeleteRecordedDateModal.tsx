import React, { useState, useEffect } from 'react';
import { CalendarX, ShieldCheck, XCircle, X } from 'lucide-react';
import { generateMathChallenge } from '../utils/calculations';

interface DeleteRecordedDateModalProps {
  isOpen: boolean;
  dateRangeDisplay: string;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteRecordedDateModal: React.FC<DeleteRecordedDateModalProps> = ({
  isOpen,
  dateRangeDisplay,
  onClose,
  onConfirmDelete,
}) => {
  const [challenge, setChallenge] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChallenge(generateMathChallenge());
      setUserAnswer('');
      setHasError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed) || parsed !== challenge.answer) {
      setHasError(true);
      return;
    }
    onConfirmDelete();
    onClose();
  };

  return (
    <div
      id="deleteRecordedDateModal"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-red-500">
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <CalendarX className="w-5 h-5 text-white" />
            <span>SECURITY CHECK: Delete Recorded Date Period</span>
          </h4>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center text-xs font-bold text-red-900">
            <div>PERMANENTLY DELETE ENTIRE RECORDED WEEK/DATE:</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{dateRangeDisplay}</div>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed">
            This action will completely remove the saved record for this selected date block from database storage.{' '}
            <strong className="text-red-600">This cannot be undone.</strong>
          </p>

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
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
            >
              Confirm Delete Period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
