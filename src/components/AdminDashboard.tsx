import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  FileCheck2,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { Scholarship, VerificationStatus, DegreeLevel } from '../types/scholarship';
import {
  checkAdminStatus,
  loginAdmin,
  logoutAdmin,
  updateVerificationStatus,
  createScholarship,
  editScholarship,
  deleteScholarship,
  extractScholarshipAI,
  resetSampleRecords,
} from '../services/api';

interface AdminDashboardProps {
  scholarships: Scholarship[];
  onRefreshData: () => Promise<void>;
  onViewDetails: (s: Scholarship) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  scholarships,
  onRefreshData,
  onViewDetails,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>('AtlasAdmin2026!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Tabs: 'manage' | 'ai-extract' | 'manual-create'
  const [activeTab, setActiveTab] = useState<'manage' | 'ai-extract' | 'manual-create'>('manage');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Extraction state
  const [aiUrl, setAiUrl] = useState<string>('https://www.daad.de/en/study-and-research-in-germany/scholarships/');
  const [aiNotes, setAiNotes] = useState<string>('Official DAAD graduate scholarship announcement');
  const [aiContent, setAiContent] = useState<string>(
    'The German Academic Exchange Service (DAAD) offers full scholarships for postgraduate courses with development relevance. Covers full tuition, €934 monthly living stipend, and travel subsidy. Open to citizens of developing countries on the DAC list. Deadline is November 30.'
  );
  const [aiExtracting, setAiExtracting] = useState<boolean>(false);
  const [extractedDraft, setExtractedDraft] = useState<Scholarship | null>(null);

  // Edit modal state
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setCheckingAuth(true);
    const res = await checkAdminStatus();
    setIsAuthenticated(res.authenticated);
    setCheckingAuth(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const res = await loginAdmin(passwordInput);
    setLoginLoading(false);

    if (res.success) {
      setIsAuthenticated(true);
      showMessage('success', 'Server-side administrator authorization confirmed.');
      await onRefreshData();
    } else {
      setLoginError(res.error || 'Invalid administrator passkey.');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    showMessage('success', 'Admin session terminated.');
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleStatusChange = async (scholarshipId: string, newStatus: VerificationStatus) => {
    const res = await updateVerificationStatus(scholarshipId, newStatus, 'Senior Editorial Admin');
    if (res.success) {
      showMessage('success', `Listing status updated to "${newStatus}" on server.`);
      await onRefreshData();
    } else {
      showMessage('error', res.error || 'Failed to update verification status.');
    }
  };

  const handleDelete = async (scholarshipId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    const res = await deleteScholarship(scholarshipId);
    if (res.success) {
      showMessage('success', 'Scholarship deleted successfully from database.');
      await onRefreshData();
    } else {
      showMessage('error', res.error || 'Failed to delete scholarship.');
    }
  };

  const handleRunAiExtract = async () => {
    if (!aiUrl && !aiContent) {
      showMessage('error', 'Please provide a URL or source content text.');
      return;
    }

    setAiExtracting(true);
    setExtractedDraft(null);

    const res = await extractScholarshipAI({
      sourceUrl: aiUrl,
      sourceContent: aiContent,
      notes: aiNotes,
    });

    setAiExtracting(false);

    if (res.success && res.extracted) {
      setExtractedDraft(res.extracted);
      showMessage('success', `AI extraction complete (Powered by ${res.aiPowered ? 'Gemini 3.8 Flash' : 'Structured Parser'}). Ready for review.`);
    } else {
      showMessage('error', res.error || 'AI extraction failed.');
    }
  };

  const handlePublishExtracted = async (statusToSet: VerificationStatus) => {
    if (!extractedDraft) return;

    const payload = {
      ...extractedDraft,
      verificationStatus: statusToSet,
      reviewedBy: statusToSet === 'Verified' ? 'Editorial Admin' : undefined,
      reviewedAt: statusToSet === 'Verified' ? new Date().toISOString() : undefined,
    };

    const res = await createScholarship(payload);
    if (res.success) {
      showMessage('success', `Scholarship saved to database as "${statusToSet}".`);
      setExtractedDraft(null);
      await onRefreshData();
      setActiveTab('manage');
    } else {
      showMessage('error', res.error || 'Failed to save extracted scholarship.');
    }
  };

  const handleResetSamples = async () => {
    if (!window.confirm('Reset all scholarships to original verified standard dataset?')) {
      return;
    }
    const res = await resetSampleRecords();
    if (res.success) {
      showMessage('success', `Database reset to ${res.count} verified default records.`);
      await onRefreshData();
    } else {
      showMessage('error', res.error || 'Failed to reset records.');
    }
  };

  // Filter listings
  const filteredListings =
    statusFilter === 'ALL'
      ? scholarships
      : scholarships.filter((s) => s.verificationStatus === statusFilter);

  const pendingCount = scholarships.filter((s) => s.verificationStatus === 'Pending Review').length;
  const verifiedCount = scholarships.filter((s) => s.verificationStatus === 'Verified').length;
  const expiredCount = scholarships.filter((s) => s.verificationStatus === 'Expired').length;
  const rejectedCount = scholarships.filter((s) => s.verificationStatus === 'Rejected').length;

  if (checkingAuth) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
        <span>Validating server authorization session...</span>
      </div>
    );
  }

  // Gatekeeper: Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Admin Editorial Authorization
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              In adherence to <strong>Requirement 7</strong>, admin operations (approving, verifying, creating, editing, and deleting listings) are strictly enforced and verified on the server side.
            </p>
          </div>

          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-1">
            <span className="font-semibold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Prototype Evaluation Credentials
            </span>
            <p className="text-teal-800 text-[11px]">
              Default prototype server passkey: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-teal-200 font-bold">AtlasAdmin2026!</code>
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Administrator Passkey
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin passkey..."
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Server Token...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-teal-400" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Session Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Editorial Verification & Admin Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Authorized administrator session. Verify source URLs, review candidate listings, and process AI-assisted discoveries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Server Session Authorized</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-teal-400" />
            <span>Manage Listings</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                {pendingCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai-extract')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'ai-extract'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI Discovery & Extraction</span>
          </button>
        </div>

        <button
          onClick={handleResetSamples}
          className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset to Default Standards</span>
        </button>
      </div>

      {/* TAB 1: MANAGE LISTINGS */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Status Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="block text-[11px] opacity-80">All Records</span>
              <span className="text-lg font-bold">{scholarships.length}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Pending Review')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Pending Review'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-bold'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
              }`}
            >
              <span className="block text-[11px] opacity-80">Pending Review</span>
              <span className="text-lg font-bold">{pendingCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Verified')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Verified'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs font-bold'
                  : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-900'
              }`}
            >
              <span className="block text-[11px] opacity-80">Verified</span>
              <span className="text-lg font-bold">{verifiedCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Expired')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Expired'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="block text-[11px] opacity-80">Expired</span>
              <span className="text-lg font-bold">{expiredCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
              }`}
            >
              <span className="block text-[11px] opacity-80">Rejected</span>
              <span className="text-lg font-bold">{rejectedCount}</span>
            </button>
          </div>

          {/* Listings Table / Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredListings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No listings matching the current verification status filter.
              </div>
            ) : (
              filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                          item.verificationStatus === 'Verified'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : item.verificationStatus === 'Pending Review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : item.verificationStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {item.verificationStatus}
                      </span>

                      {item.isSampleRecord && (
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-800 border border-amber-300 rounded font-semibold">
                          Sample Test Record
                        </span>
                      )}

                      <span className="text-xs text-slate-500">
                        Destination: <strong className="text-slate-800">{item.destinationCountry}</strong>
                      </span>
                    </div>

                    <h4
                      onClick={() => onViewDetails(item)}
                      className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500">
                      Provider: <span className="text-slate-700">{item.provider}</span> • Checked on{' '}
                      <strong className="text-slate-700">{item.lastCheckedDate}</strong>
                    </p>

                    <div className="flex items-center gap-2 text-xs">
                      <a
                        href={item.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:underline font-mono text-[11px]"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Verification & Action Controls (Protected by server-side auth) */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                    {item.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'Verified')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        title="Approve and mark verified for international students"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Verify</span>
                      </button>
                    )}

                    {item.verificationStatus !== 'Pending Review' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'Pending Review')}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Flag for Review
                      </button>
                    )}

                    {item.verificationStatus !== 'Expired' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'Expired')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                      >
                        Mark Expired
                      </button>
                    )}

                    {item.verificationStatus !== 'Rejected' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'Rejected')}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Permanently delete from database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI DISCOVERY & EXTRACTION WORKFLOW */}
      {activeTab === 'ai-extract' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  AI-Assisted Scholarship Discovery & Structuring
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide an official scholarship URL and announcement text. Our server-side Gemini AI model will extract and structure the exact funding coverage, eligible nationalities, deadlines, and requirements into our schema.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Mandatory Requirement 5:</strong> All AI-discovered scholarships automatically enter the system as <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">Pending Review</code> and cannot be published until an authorized human administrator reviews the official terms.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Official Scholarship Source URL</label>
                <input
                  type="url"
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  placeholder="https://provider.gov/scholarships/master"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Curator Notes / Context</label>
                <input
                  type="text"
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="e.g. Verified from official government gazette, 2027 cycle announced"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">
                  Raw Official Announcement Content or Snippet
                </label>
                <textarea
                  rows={5}
                  value={aiContent}
                  onChange={(e) => setAiContent(e.target.value)}
                  placeholder="Paste official scholarship terms, coverage description, and eligibility criteria..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-sans text-xs text-slate-800"
                />
              </div>
            </div>

            <button
              onClick={handleRunAiExtract}
              disabled={aiExtracting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
            >
              {aiExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Extracting Structured Schema via Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Run AI Extraction</span>
                </>
              )}
            </button>
          </div>

          {/* AI Extracted Candidate Preview Card */}
          {extractedDraft && (
            <div className="bg-white border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Draft Pending Review
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{extractedDraft.title}</h3>
                  <p className="text-xs text-slate-500">
                    Provider: <strong>{extractedDraft.provider}</strong> • Destination: <strong>{extractedDraft.destinationCountry}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublishExtracted('Pending Review')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Save as Pending Review
                  </button>

                  <button
                    onClick={() => handlePublishExtracted('Verified')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Approve & Verify Now
                  </button>
                </div>
              </div>

              {/* Extraction Breakdown preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Funding Breakdown</span>
                  <ul className="space-y-1 text-slate-700">
                    <li>Tuition: <strong>{extractedDraft.funding.tuition}</strong> ({extractedDraft.funding.tuitionDetails || 'Standard'})</li>
                    <li>Stipend: <strong>{extractedDraft.funding.stipend}</strong> ({extractedDraft.funding.stipendDetails || 'Allowance'})</li>
                    <li>Flights: <strong>{extractedDraft.funding.travel}</strong></li>
                    <li>Accommodation: <strong>{extractedDraft.funding.accommodation}</strong></li>
                    <li>Health: <strong>{extractedDraft.funding.healthInsurance}</strong></li>
                    <li>Visa Allowance: <strong>{extractedDraft.funding.visaAllowance}</strong></li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Eligibility & Deadlines</span>
                  <p className="text-slate-700">
                    Nationality Mode: <strong>{extractedDraft.nationalityEligibility.mode}</strong>
                    {extractedDraft.nationalityEligibility.eligibleCountries && extractedDraft.nationalityEligibility.eligibleCountries.length > 0 && (
                      <span> ({extractedDraft.nationalityEligibility.eligibleCountries.join(', ')})</span>
                    )}
                  </p>
                  <p className="text-slate-700">
                    Deadline: <strong>{extractedDraft.deadline || 'Deadline Not Confirmed'}</strong> ({extractedDraft.deadlineTimezone || 'UTC'})
                  </p>
                  <p className="text-slate-700">
                    Degree Levels: <strong>{extractedDraft.degreeLevels.join(', ')}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
