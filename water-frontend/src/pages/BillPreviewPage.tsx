import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Printer, Download, Mail, CheckCircle, 
  RotateCw, RefreshCw, AlertTriangle, ShieldAlert, Award, FileSpreadsheet 
} from 'lucide-react';
import { billingService, type Bill } from '../services/billingService';
import { toast } from 'sonner';

export default function BillPreviewPage({ id: propId }: { id?: string }) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId;
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBillDetails();
    }
  }, [id]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const data = await billingService.getBillDetails(Number(id));
      setBill(data);
    } catch (err: any) {
      toast.error('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!bill) return;
    const url = billingService.downloadPdfUrl(bill.id);
    // Open in new window/tab to trigger browser download dialog
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-white">
        <RotateCw className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#090d16] text-white">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <button
          onClick={() => navigate('/admin/billing')}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const baseUsageCharge = Math.max(
    0,
    bill.amount -
      bill.taxAmount -
      bill.lateFee -
      bill.penalty -
      bill.serviceCharge -
      bill.maintenanceCharge -
      bill.sewageCharge +
      bill.discountAmount +
      bill.subsidyAmount
  );

  return (
    <div className="min-h-screen bg-[#090d16] p-6 text-white md:p-10 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-4xl print:max-w-full">
        
        {/* Navigation / Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Invoices
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold transition"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold transition"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-8 shadow-xl backdrop-blur-md print:border-0 print:bg-white print:p-0 print:shadow-none">
          
          {/* Brand Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-slate-800/80 pb-6 md:flex-row print:flex-row print:justify-between print:border-slate-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-600 p-2 text-white print:bg-blue-600 print:text-white">
                  💧
                </span>
                <span className="text-2xl font-black tracking-tight text-white print:text-black">HydroBS</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 print:text-slate-600">
                Water Utility Management & billing solutions.
              </p>
              <p className="text-xs text-slate-500 print:text-slate-500 mt-1">
                Community: <span className="font-semibold text-slate-300 print:text-slate-700">{bill.communityName}</span>
              </p>
            </div>

            <div className="text-left md:text-right print:text-right">
              <h2 className="text-xl font-bold uppercase tracking-wide text-blue-400 print:text-blue-600">Water Utility Invoice</h2>
              <div className="mt-2 text-sm text-slate-400 print:text-slate-600 space-y-1">
                <div>Invoice No: <span className="font-semibold text-slate-200 print:text-black">{bill.invoiceNumber}</span></div>
                <div>Bill Ref: <span className="font-semibold text-slate-200 print:text-black">{bill.billNumber}</span></div>
                <div>Billing Month: <span className="font-semibold text-slate-200 print:text-black">{bill.billingMonth.substring(0, 7)}</span></div>
                <div>Status: <span className={`font-bold uppercase ${bill.status === 'PAID' ? 'text-emerald-400 print:text-emerald-600' : 'text-amber-400 print:text-amber-600'}`}>{bill.status}</span></div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="my-8 grid gap-8 md:grid-cols-2 print:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-slate-400 mb-2">Billed To:</h3>
              <div className="text-slate-300 print:text-black space-y-1">
                <div className="font-bold text-lg text-white print:text-black">{bill.residentName}</div>
                <div className="text-sm">{bill.residentEmail}</div>
                <div className="text-sm">{bill.residentPhone}</div>
                <div className="text-sm text-slate-400 print:text-slate-600 mt-2">
                  Flat {bill.flatNumber}, Floor {bill.floor}, Building {bill.building}, Block {bill.block}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-slate-400 mb-2">Reading Snapshot:</h3>
              <div className="rounded-lg bg-[#162035]/40 p-4 border border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-black space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 print:text-slate-600">Previous Reading:</span>
                  <span className="font-semibold">{bill.previousReading.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 print:text-slate-600">Current Reading:</span>
                  <span className="font-semibold">{bill.currentReading.toFixed(2)} L</span>
                </div>
                <div className="border-t border-slate-800/80 my-2 pt-2 flex justify-between text-sm font-bold print:border-slate-300">
                  <span className="text-slate-300 print:text-slate-700">Total Consumption:</span>
                  <span className="text-blue-400 print:text-blue-600">{bill.totalUsage.toFixed(2)} L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-slate-400 mb-3">Itemized Summary:</h3>
            <div className="overflow-hidden border border-slate-800 rounded-lg print:border-slate-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#162035]/40 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-slate-600">
                    <th className="p-3">Charge Description</th>
                    <th className="p-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm print:divide-slate-300">
                  <tr>
                    <td className="p-3">
                      Water Consumption Charges
                      <div className="text-[10px] text-slate-500">Model: {bill.tariffModel}</div>
                    </td>
                    <td className="p-3 text-right font-semibold">₹{baseUsageCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Fixed Service Charge</td>
                    <td className="p-3 text-right font-semibold">₹{bill.serviceCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Maintenance Fee</td>
                    <td className="p-3 text-right font-semibold">₹{bill.maintenanceCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Sewage Service Fee</td>
                    <td className="p-3 text-right font-semibold">₹{bill.sewageCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Taxes & Surcharges</td>
                    <td className="p-3 text-right font-semibold">₹{bill.taxAmount.toFixed(2)}</td>
                  </tr>
                  {bill.lateFee > 0 && (
                    <tr>
                      <td className="p-3 text-amber-400 print:text-amber-600">Late Payment Interest Fee</td>
                      <td className="p-3 text-right font-semibold text-amber-400 print:text-amber-600">₹{bill.lateFee.toFixed(2)}</td>
                    </tr>
                  )}
                  {bill.penalty > 0 && (
                    <tr>
                      <td className="p-3 text-red-400 print:text-red-600">Violation Penalty Surcharge</td>
                      <td className="p-3 text-right font-semibold text-red-400 print:text-red-600">₹{bill.penalty.toFixed(2)}</td>
                    </tr>
                  )}
                  {bill.discountAmount > 0 && (
                    <tr>
                      <td className="p-3 text-emerald-400 print:text-emerald-600">Coupon Discount Deduction</td>
                      <td className="p-3 text-right font-semibold text-emerald-400 print:text-emerald-600">- ₹{bill.discountAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {bill.subsidyAmount > 0 && (
                    <tr>
                      <td className="p-3 text-indigo-400 print:text-indigo-600">State Subsidy Relief</td>
                      <td className="p-3 text-right font-semibold text-indigo-400 print:text-indigo-600">- ₹{bill.subsidyAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-[#162035]/60 text-base font-bold border-t border-slate-800 print:bg-slate-100 print:border-slate-300">
                    <td className="p-3">Total Amount Due:</td>
                    <td className="p-3 text-right text-blue-400 print:text-black">₹{bill.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Code Placeholder and Billing Notes */}
          <div className="mt-8 grid gap-6 md:grid-cols-2 print:grid-cols-2">
            <div className="space-y-4">
              {bill.notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Invoice Notes:</h4>
                  <p className="text-sm text-slate-400 print:text-slate-600">{bill.notes}</p>
                </div>
              )}
              <div className="text-xs text-slate-500 space-y-1">
                <div>Invoice Generated By: <span className="font-semibold">{bill.generatedBy || 'Automated Engine'}</span></div>
                <div>Issue Date: <span className="font-semibold">{new Date(bill.generatedAt).toLocaleString()}</span></div>
                <div>Payment Due Date: <span className="font-semibold text-slate-300 print:text-slate-700">{bill.dueDate}</span></div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end print:items-end">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Scan & Pay:</h4>
              <div className="rounded border border-slate-800 bg-slate-900/60 p-3 flex flex-col items-center print:border-slate-300 print:bg-slate-100">
                {/* Visual QR Placeholder */}
                <div className="h-28 w-28 bg-white p-2 rounded flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-1 h-full w-full">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div key={idx} className={`rounded-sm ${idx % 3 === 0 || idx % 5 === 1 ? 'bg-black' : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] mt-2 text-slate-400 print:text-slate-600 font-bold uppercase tracking-wider">HydroBS FastPay QR</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bill Revision History List */}
        {bill.revisions && bill.revisions.length > 0 && (
          <div className="mt-8 border-t border-slate-800 pt-6 print:hidden">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400 mb-4">
              <RefreshCw className="h-5 w-5" /> Revision History Log
            </h3>
            <div className="space-y-4">
              {bill.revisions.map((rev, index) => (
                <div key={rev.id} className="rounded-lg border border-slate-800 bg-[#0e1626]/40 p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
                    <span className="font-semibold text-slate-300">Revision #{rev.revisionNumber}</span>
                    <span className="text-xs text-slate-500">{new Date(rev.revisedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                    <div>Amount Payable: <span className="font-semibold text-slate-200">₹{rev.amount.toFixed(2)}</span></div>
                    <div>Taxes: <span className="font-semibold text-slate-200">₹{rev.taxAmount.toFixed(2)}</span></div>
                    <div>Penalty Applied: <span className="font-semibold text-slate-200">₹{rev.penalty.toFixed(2)}</span></div>
                    <div>Subsidy Applied: <span className="font-semibold text-slate-200">₹{rev.subsidyAmount.toFixed(2)}</span></div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-900/35 p-2 rounded">
                    <span className="font-bold text-slate-300">Adjustment Reason:</span> {rev.reason}
                  </div>
                  <div className="text-[10px] text-slate-500">Adjusted By: {rev.revisedBy}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
