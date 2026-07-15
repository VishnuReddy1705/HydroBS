import { useState, useEffect } from "react";
import { residentService } from "../services/residentService";
import { api } from "@/lib/axios";
import DashboardLayout from "../components/DashboardLayout";
import { 
  User, Mail, Phone, Calendar, Shield, MapPin, Building, Key, 
  Droplet, FileText, Download, Trash2, Loader2, CheckCircle2, 
  Plus, Edit, Users, Clock, AlertTriangle, FileUp, ListFilter
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ResidentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [family, setFamily] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Modals / Forms States
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberName, setMemberName] = useState("");
  const [memberRelationship, setMemberRelationship] = useState("SPOUSE");
  const [memberAge, setMemberAge] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileType, setUploadFileType] = useState("GOVERNMENT_ID");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const prof = await residentService.getMyProfile();
      setProfile(prof);

      const fm = await residentService.getMyFamily();
      setFamily(fm);

      const docs = await residentService.getMyDocuments();
      setDocuments(docs);

      const time = await residentService.getMyTimeline();
      setTimeline(time);
    } catch (err: any) {
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    try {
      const payload = {
        name: memberName,
        relationship: memberRelationship,
        age: memberAge ? parseInt(memberAge) : undefined,
        contactNumber: memberPhone || undefined,
        status: "ACTIVE"
      };

      if (editingMember) {
        await residentService.editFamilyMember(editingMember.id, payload);
        toast.success("Household member updated.");
      } else {
        await residentService.addFamilyMember(payload);
        toast.success("Household member added.");
      }

      setShowFamilyModal(false);
      // Reset forms
      setMemberName("");
      setMemberAge("");
      setMemberPhone("");
      setMemberRelationship("SPOUSE");

      // Reload family data
      const fm = await residentService.getMyFamily();
      setFamily(fm);
    } catch (err: any) {
      toast.error("Failed to save family member.");
    }
  };

  const handleEditMember = (m: any) => {
    setEditingMember(m);
    setMemberName(m.name);
    setMemberRelationship(m.relationship);
    setMemberAge(m.age?.toString() || "");
    setMemberPhone(m.contactNumber || "");
    setShowFamilyModal(true);
  };

  const handleRemoveMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    try {
      await residentService.removeFamilyMember(id);
      toast.success("Household member removed.");
      const fm = await residentService.getMyFamily();
      setFamily(fm);
    } catch (err) {
      toast.error("Failed to remove family member.");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      await residentService.uploadDocument(uploadFile, uploadFileType);
      toast.success("Document uploaded successfully.");
      setShowUploadModal(false);
      setUploadFile(null);
      
      const docs = await residentService.getMyDocuments();
      setDocuments(docs);
    } catch (err: any) {
      toast.error(err.response?.data || "Failed to upload document. Maximum file size is 10MB (PDF, JPG, PNG).");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await residentService.deleteDocument(id);
      toast.success("Document deleted.");
      const docs = await residentService.getMyDocuments();
      setDocuments(docs);
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const handleDownloadDoc = (docId: number) => {
    window.open(`${api.defaults.baseURL}/api/profile/documents/${docId}/download`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 text-[#00B4D8] animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      role="RESIDENT"
      title="My Profile" 
      subtitle="Manage your personal details, household members, and attachments"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-100 max-w-5xl mx-auto">
        
        {/* Profile Card Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 text-center shadow-xs">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0F4C81] to-[#00B4D8] mx-auto flex items-center justify-center font-bold text-white text-3xl shadow-lg border border-white/20">
              {profile?.fullName?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <h2 className="text-lg font-black mt-4 text-[#0F4C81] dark:text-[#00B4D8]">{profile?.fullName}</h2>
            <p className="text-xs text-slate-400 font-semibold">{profile?.email}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3" /> {profile?.isActive ? "ACTIVE RESIDENT" : "INACTIVE"}
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

          <div className="md:col-span-2 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 dark:border-slate-800 pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
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

        {/* Community and Unit Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 dark:border-slate-800 pb-2 mb-4">Assigned Meter Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Assigned Meter No</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><Key className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.meterNumber || "No Meter Assigned"}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Family / Household Size</span>
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300"><Users className="h-3.5 w-3.5 text-[#00B4D8]" /> {profile?.familySize || 1} members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Household / Family Management */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Household Directory</h3>
            <button 
              onClick={() => { setEditingMember(null); setShowFamilyModal(true); }}
              className="px-3 py-1.5 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {family.length > 0 ? (
              family.map((m: any) => (
                <div key={m.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:shadow-xs transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 text-[#0F4C81] dark:text-[#00B4D8] rounded-xl font-black text-xs">
                      {m.relationship.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.name} ({m.age ? `${m.age} yrs` : "Age N/A"})</p>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">{m.relationship} {m.contactNumber ? `• ${m.contactNumber}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditMember(m)}
                      className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-[#00B4D8] rounded-lg cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">No household members registered.</div>
            )}
          </div>
        </div>

        {/* Documents Vault */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Vault</h3>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileUp className="h-3.5 w-3.5" /> Upload File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.length > 0 ? (
              documents.map((d: any) => (
                <div key={d.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:shadow-xs transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/20 text-[#00B4D8] rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-200" title={d.fileName}>{d.fileName}</p>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">{d.documentType.replace("_", " ")} • {(d.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDownloadDoc(d.id)}
                      className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-[#00B4D8] rounded-lg cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteDoc(d.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">No documents uploaded yet. Max upload size is 10MB (PDF, JPG, PNG).</div>
            )}
          </div>
        </div>

        {/* Login & Profile Timeline Audit Logs */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0c1929] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">My Timeline & Audit logs</h3>
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
              <div className="py-8 text-center text-slate-400 text-xs">No timeline records generated.</div>
            )}
          </div>
        </div>

      </div>

      {/* Household / Family Member Modal */}
      <AnimatePresence>
        {showFamilyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 dark:border-slate-800 rounded-[28px] bg-white dark:bg-[#0c1929] p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81] dark:text-[#00B4D8]">{editingMember ? "Edit Household Member" : "Add Household Member"}</h3>
                <button onClick={() => setShowFamilyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">×</button>
              </div>

              <form onSubmit={handleFamilySubmit} className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Full Name</label>
                  <input 
                    type="text" 
                    value={memberName} 
                    onChange={(e) => setMemberName(e.target.value)} 
                    placeholder="e.g. Aditi Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-slate-100 dark:focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Relationship</label>
                    <select 
                      value={memberRelationship} 
                      onChange={(e) => setMemberRelationship(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    >
                      <option value="SPOUSE">SPOUSE</option>
                      <option value="CHILD">CHILD</option>
                      <option value="PARENT">PARENT</option>
                      <option value="SIBLING">SIBLING</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Age</label>
                    <input 
                      type="number" 
                      value={memberAge} 
                      onChange={(e) => setMemberAge(e.target.value)} 
                      placeholder="e.g. 28"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Contact Number</label>
                  <input 
                    type="text" 
                    value={memberPhone} 
                    onChange={(e) => setMemberPhone(e.target.value)} 
                    placeholder="e.g. +91 99999 88888"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowFamilyModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0F4C81] text-white rounded-xl shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="border border-slate-100 dark:border-slate-800 rounded-[28px] bg-white dark:bg-[#0c1929] p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-[#0F4C81] dark:text-[#00B4D8]">Upload Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">×</button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Document Type</label>
                  <select 
                    value={uploadFileType} 
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="GOVERNMENT_ID">GOVERNMENT ID</option>
                    <option value="PROOF_OF_ADDRESS">PROOF OF ADDRESS</option>
                    <option value="RENTAL_AGREEMENT">RENTAL AGREEMENT</option>
                    <option value="OWNERSHIP_DOCUMENT">OWNERSHIP DOCUMENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Select File</label>
                  <input 
                    type="file" 
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-3.5 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0F4C81] disabled:opacity-50 text-white rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Document
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
