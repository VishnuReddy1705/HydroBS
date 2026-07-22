import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, RotateCw } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';

interface CollectPaymentDialogProps {
  bill: {
    id: number;
    billNumber: string;
    residentName: string;
    amount: number;
    flatNumber?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollectPaymentDialog({ bill, onClose, onSuccess }: CollectPaymentDialogProps) {
  const [outstanding, setOutstanding] = useState<number>(bill.amount);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);

  useEffect(() => {
    async function loadOutstanding() {
      try {
        const data = await paymentService.getOutstanding(bill.id);
        setOutstanding(data.outstanding);
        setAmount(data.outstanding.toString());
      } catch  {
        toast.error('Failed to retrieve outstanding balance');
      } finally {
        setFetching(false);
      }
    }
    loadOutstanding();
  }, [bill.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (payAmount > outstanding) {
      toast.error(`Payment amount cannot exceed outstanding balance of ₹${outstanding}`);
      return;
    }

    try {
      setLoading(true);
      await paymentService.recordOfflinePayment({
        billId: bill.id,
        amount: payAmount,
        paymentMethod,
        transactionReference,
        notes
      });
      toast.success('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
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
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Record Payment
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <RotateCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm">Fetching outstanding balance...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Info Summary */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Resident:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{bill.residentName} ({bill.flatNumber || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Number:</span>
                <span className="font-mono text-slate-900 dark:text-white">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-bold">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{outstanding.toFixed(2)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Amount (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  ₹
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-[#0b1329] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR Scan</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Reference</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Txn ID, Reference Number, Cheque #"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memo / Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for bookkeeping..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
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
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Record Payment</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
