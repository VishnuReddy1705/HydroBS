import React, { useState, useEffect } from 'react';
import { paymentService } from '@/services/paymentService';
import type { PaymentResponse } from '@/services/paymentService';
import { Download, RefreshCw, Undo2, RotateCw, AlertTriangle } from 'lucide-react';
import { getToken, getRole } from '@/lib/auth';
import { toast } from 'sonner';
import RefundDialog from './RefundDialog';

export default function PaymentHistoryPanel() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [reversing, setReversing] = useState<number | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [refundingPayment, setRefundingPayment] = useState<any | null>(null);

  const role = getRole();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  useEffect(() => {
    loadPayments();
  }, [page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPaymentHistory(page, 10);
      setPayments(data.content);
      setTotalPages(data.totalPages);
    } catch  {
      toast.error('Failed to load payment transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (payment: PaymentResponse) => {
    try {
      const token = getToken();
      const url = paymentService.downloadReceiptUrl(payment.id, token || undefined);
      window.open(url, '_blank');
      toast.success('Downloading payment receipt...');
    } catch  {
      toast.error('Failed to open receipt download URL');
    }
  };

  const handleReverse = async (paymentId: number) => {
    if (!reversalReason.trim()) {
      toast.error('Please enter a reason for reversal');
      return;
    }

    try {
      setReversing(paymentId);
      await paymentService.reversePayment(paymentId, reversalReason);
      toast.success('Payment transaction reversed successfully');
      setReversalReason('');
      setReversing(null);
      loadPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reverse payment');
      setReversing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">Completed</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">Failed</span>;
      case 'REVERSED':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">Reversed</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Refunded</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Payment Ledger
        </h3>
        <button
          onClick={loadPayments}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0F4C81] dark:text-[#00B4D8] bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <RotateCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm">Loading transaction ledger...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
          No payment transactions found in this ledger scope.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Receipt No</th>
                <th className="p-4 font-semibold">Bill Reference</th>
                <th className="p-4 font-semibold">Resident</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="p-4">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="p-4 font-mono font-bold text-slate-500">{p.receiptNumber || 'N/A'}</td>
                  <td className="p-4 font-mono">{p.billNumber}</td>
                  <td className="p-4 font-medium">{p.residentName}</td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount.toFixed(2)}</td>
                  <td className="p-4 text-xs font-semibold">{p.paymentMethod}</td>
                  <td className="p-4 font-mono text-xs">{p.transactionId}</td>
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Receipt download */}
                      {p.status.toUpperCase() === 'COMPLETED' && (
                        <button
                          onClick={() => handleDownloadReceipt(p)}
                          title="Download PDF Receipt"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Admin refund/reversal options */}
                      {isAdmin && p.status.toUpperCase() === 'COMPLETED' && (
                        <>
                          {/* Refund request */}
                          <button
                            onClick={() => setRefundingPayment({
                              id: p.id,
                              amount: p.amount,
                              residentName: p.residentName,
                              transactionId: p.transactionId
                            })}
                            title="Request Refund"
                            className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reversal trigger */}
                          <button
                            onClick={() => {
                              const reason = window.prompt("Enter reason for reversing payment:");
                              if (reason !== null) {
                                setReversalReason(reason);
                                handleReverse(p.id);
                              }
                            }}
                            title="Reverse Payment"
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Refund dialog */}
      {refundingPayment && (
        <RefundDialog
          payment={refundingPayment}
          onClose={() => setRefundingPayment(null)}
          onSuccess={loadPayments}
        />
      )}

    </div>
  );
}
