import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { residentService } from "../services/residentService";
import { api } from "@/lib/axios";
import DashboardLayout from "../components/DashboardLayout";
import { 
  User, Mail, Phone, Calendar, Shield, MapPin, Building, Key, 
  Droplet, FileText, Download, Trash2, ArrowLeft, Loader2, CheckCircle2, 
  AlertTriangle, DollarSign, Clock, Users, ArrowUpRight, BarChart3, Settings
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ResidentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [consumptionData, setConsumptionData] = useState<any[]>([]);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const prof = await residentService.getResidentById(id);
      setProfile(prof);

      // Fetch bills for this resident
      const billsRes = await api.get("/api/water/bills");
      const resBills = billsRes.data.filter((b: any) => b.flatNumber === prof.flatNumber);
      setBills(resBills);

      // Map consumption data from bills
      const chartData = [...resBills]
        .sort((a, b) => new Date(a.billingMonth).getTime() - new Date(b.billingMonth).getTime())
        .map((b: any) => ({
          name: new Date(b.billingMonth).toLocaleDateString([], { month: "short", year: "2-digit" }),
          usage: parseFloat(b.totalUsage || "0"),
          amount: parseFloat(b.amount || "0")
        }));
      setConsumptionData(chartData);

      // Load documents (requires admin authority)
      const docRes = await api.get(`/api/profile/documents?residentId=${id}`);
      setDocuments(docRes.data || []);

      // Load family members (requires admin authority)
      const fmRes = await api.get(`/api/profile/family?residentId=${id}`);
      setFamily(fmRes.data || []);
      
      // Load timeline logs
      const timeRes = await api.get(`/api/profile/timeline?residentId=${id}`);
      setTimeline(timeRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load resident details or permissions denied.");
      navigate("/residents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDownloadDoc = (docId: number, fileName: string) => {
    window.open(`${api.defaults.baseURL}/api/profile/documents/${docId}/download`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 text-[#00B4D8] animate-spin" />
      </div>
    );
  }

  const role = (localStorage.getItem("hydrobs_role") || "ADMIN") as "SUPER_ADMIN" | "ADMIN" | "RESIDENT";

  return (
    <DashboardLayout 
      role={role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN"}
      title="Resident Profile" 
      subtitle={`View administrative details for ${profile?.fullName || "Resident"}`}
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-100">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </button>

        {/* Profile Card Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 text-center shadow-xs">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0F4C81] to-[#00B4D8] mx-auto flex items-center justify-center font-bold text-white text-3xl shadow-lg border border-white/20">
              {profile?.fullName?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <h2 className="text-lg font-black mt-4 text-[#0F4C81] dark:text-[#00B4D8]">{profile?.fullName}</h2>
            <p className="text-xs text-slate-400 font-semibold">{profile?.email}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3" /> {profile?.isActive ? "ACTIVE" : "INACTIVE"}
            </div>

            <div className="mt-6 border-t border-slate-50 dark:border-slate-800 pt-6 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Water Balance</span>
                <span className="text-sm font-black text-[#00B4D8]">₹{profile?.waterBalance?.toFixed(2) || "0.00"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 capitalize">{profile?.occupancyType?.toLowerCase() || "Tenant"}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 dark:border-slate-800 pb-2">Personal & emergency Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Phone Number</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.phoneNumber || "Not provided"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Gender</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{profile?.gender?.toLowerCase() || "Not specified"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Date of Birth</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Emergency Contact</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.emergencyContactName || "Not provided"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Emergency Phone</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.emergencyContactPhone || "Not provided"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Move-in Date</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.moveInDate ? new Date(profile.moveInDate).toLocaleDateString() : "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address and Meter Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 dark:border-slate-800 pb-2 mb-4">Location & Unit Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Community</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><Building className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.communityName}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Flat / Unit</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><MapPin className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.flatNumber}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Building & Block</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.building || "N/A"} (Block {profile?.block || "N/A"})</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Floor</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.floor || "N/A"} Floor</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 dark:border-slate-800 pb-2 mb-4">Water Meter Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Assigned Meter No</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><Key className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.meterNumber || "No Meter Assigned"}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Family / Household Size</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><Users className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.familySize || 1} members</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Last Reading Index</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.latestMeterReading || "0.00"} Litres</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Last Reading Date</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.latestReadingDate ? new Date(profile.latestReadingDate).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consumption History Chart */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Usage & Consumption Trend</h3>
          <div className="h-[280px]">
            {consumptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionData}>
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="usage" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#usageGrad)" name="Usage (Litres)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No consumption data recorded.</div>
            )}
          </div>
        </div>

        {/* Invoices List */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Billing History</h3>
          <div className="overflow-hidden border border-slate-50 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {bills.length > 0 ? (
                  bills.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-bold">{new Date(b.billingMonth + "-01").toLocaleDateString([], { month: "long", year: "numeric" })}</td>
                      <td className="px-5 py-3">{b.totalUsage} Litres</td>
                      <td className="px-5 py-3 font-bold text-[#0F4C81] dark:text-[#00B4D8]">₹{b.amount?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-slate-400">{new Date(b.dueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          b.status === "PAID"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">No invoices logged for this resident.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documents & Attachments */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length > 0 ? (
              documents.map((d: any) => (
                <div key={d.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:shadow-xs transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/20 text-[#00B4D8] rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-200" title={d.fileName}>{d.fileName}</p>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">{d.documentType.replace("_", " ")}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownloadDoc(d.id, d.fileName)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 text-[#00B4D8] rounded-lg cursor-pointer"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">No documents uploaded.</div>
            )}
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity History</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {timeline.length > 0 ? (
              timeline.map((log: any) => (
                <div key={log.id} className="flex gap-4 items-start text-xs border-l-2 border-slate-100 dark:border-slate-800 pl-4 relative">
                  <div className="h-2 w-2 rounded-full bg-[#00B4D8] absolute -left-[5px] top-1"></div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{log.actionType.replace("_", " ")}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">No recent actions recorded.</div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
