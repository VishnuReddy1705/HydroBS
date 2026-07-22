import React, { useState } from 'react';
import { X, RefreshCcw, CheckCircle, RotateCw } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';

interface RefundDialogProps {
  payment: {
    id: number;
    amount: number;
    residentName: string;
    transactionId: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundDialog({ payment, onClose, onSuccess }: RefundDialogProps) {
  const [amount, setAmount] = useState<string>(payment.amount.toString());
  const [reason, setReason] = useState<string>('Duplicate Payment');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseFloat(amount);

    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (refundAmount > payment.amount) {
      toast.error(`Refund amount cannot exceed original payment amount of ₹${payment.amount}`);
      return;
    }

    try {
      setLoading(true);
      await paymentService.initiateRefund({
        paymentId: payment.id,
        amount: refundAmount,
        reason,
      });
      toast.success('Refund request initiated and sent for approval');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate refund request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1329] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-amber-500" />
            Request Refund
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Info Summary */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800/50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Resident:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{payment.residentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-900 dark:text-white">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-bold">
              <span className="text-slate-500">Paid Amount:</span>
              <span className="text-blue-600 dark:text-blue-400">₹{payment.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Refund Amount (INR)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to refund"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason for Refund</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-[#0b1329] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Duplicate Payment">Duplicate Payment</option>
              <option value="Incorrect Bill Calculation">Incorrect Bill Calculation</option>
              <option value="Overcharged Items">Overcharged Items</option>
              <option value="Customer Discretion / Dispute">Discretionary / Dispute Settlement</option>
              <option value="Offline Reversal">Offline Pay Reversal</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide a detailed explanation for approval context..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Submit Request</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
