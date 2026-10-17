import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Calendar,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { ApplicationTrackingStatus, SavedScholarshipItem, Scholarship } from '../types/scholarship';
import {
  getSavedScholarships,
  subscribeToSavedItems,
  unsaveScholarship,
  updateSavedStatus,
  updateSavedNotes,
  toggleChecklistItem,
  exportSavedData,
  importSavedData,
} from '../utils/storage';
import { calculateDeadlineInfo } from '../utils/deadline';

interface SavedScholarshipsViewProps {
  scholarships: Scholarship[];
  onViewDetails: (scholarship: Scholarship) => void;
  onExploreMore: () => void;
}

export const SavedScholarshipsView: React.FC<SavedScholarshipsViewProps> = ({
  scholarships,
  onViewDetails,
  onExploreMore,
}) => {
  const [savedItems, setSavedItems] = useState<SavedScholarshipItem[]>(() => getSavedScholarships());
  const [activeTab, setActiveTab] = useState<'ALL' | ApplicationTrackingStatus>('ALL');
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSavedItems(() => {
      setSavedItems(getSavedScholarships());
    });
    return unsubscribe;
  }, []);

  // Map saved items to their scholarship objects
  const savedWithScholarship = savedItems
    .map((item) => {
      const sch = scholarships.find((s) => s.id === item.scholarshipId);
      return { item, scholarship: sch };
    })
    .filter((entry): entry is { item: SavedScholarshipItem; scholarship: Scholarship } => !!entry.scholarship);

  // Filter by tab
  const filteredEntries =
    activeTab === 'ALL'
      ? savedWithScholarship
      : savedWithScholarship.filter((entry) => entry.item.status === activeTab);

  // Pipeline counts
  const interestedCount = savedItems.filter((i) => i.status === 'Interested').length;
  const preparingCount = savedItems.filter((i) => i.status === 'Preparing').length;
  const appliedCount = savedItems.filter((i) => i.status === 'Applied').length;

  const handleExport = () => {
    const dataStr = exportSavedData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scholarship-atlas-saved-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importSavedData(content);
      if (res.success) {
        setImportNotification({
          type: 'success',
          message: `Successfully imported ${res.count} scholarship records!`,
        });
      } else {
        setImportNotification({
          type: 'error',
          message: res.error || 'Failed to import backup.',
        });
      }
      setTimeout(() => setImportNotification(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Bookmark className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Scholarships & Application Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Track your target opportunities, manage document checklists, and monitor application milestones.
          </p>
        </div>

        {/* Backup / Export toolbar */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium transition-colors"
            title="Import previously exported backup file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Backup</span>
          </button>

          <button
            onClick={handleExport}
            disabled={savedItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl font-semibold transition-colors shadow-xs"
            title="Download JSON backup of your tracked applications"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            importNotification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{importNotification.message}</span>
        </div>
      )}

      {/* Mandatory Browser Storage Disclaimer (Requirement 6) */}
      <div className="bg-amber-500/10 border border-amber-300/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block text-sm">
            Browser-Based Storage Disclaimer & Data Privacy
          </span>
          <p className="leading-relaxed text-amber-950/80">
            Your saved scholarships and checklists are stored <strong>strictly on your device’s browser</strong> (localStorage). No personal tracking data is uploaded to remote servers. Please note:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pt-1">
            <li>Your saved items will <strong>not sync across different devices or browsers</strong> without exporting.</li>
            <li>If you clear your browser history or site data, your saved items can be deleted.</li>
            <li>Use the <strong>“Export Backup”</strong> button above anytime to save a safe JSON copy of your scholarship list.</li>
          </ul>
        </div>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          All Tracked ({savedItems.length})
        </button>

        <button
          onClick={() => setActiveTab('Interested')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'Interested'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
          }`}
        >
          Interested ({interestedCount})
        </button>

        <button
          onClick={() => setActiveTab('Preparing')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'Preparing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          Preparing Application ({preparingCount})
        </button>

        <button
          onClick={() => setActiveTab('Applied')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'Applied'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          Application Submitted ({appliedCount})
        </button>
      </div>

      {/* Saved Scholarships List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              {activeTab === 'ALL'
                ? 'No saved scholarships yet'
                : `No scholarships currently in "${activeTab}" status`}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore the database to find verified opportunities, save them with one click, and organize your application checklist.
            </p>
          </div>
          <button
            onClick={onExploreMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <span>Explore Scholarships</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(({ item, scholarship }) => (
            <SavedItemRow
              key={item.scholarshipId}
              item={item}
              scholarship={scholarship}
              onViewDetails={onViewDetails}
              onUnsave={() => unsaveScholarship(item.scholarshipId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SavedItemRowProps {
  item: SavedScholarshipItem;
  scholarship: Scholarship;
  onViewDetails: (s: Scholarship) => void;
  onUnsave: () => void;
}

const SavedItemRow: React.FC<SavedItemRowProps> = ({
  item,
  scholarship,
  onViewDetails,
  onUnsave,
}) => {
  const [status, setStatus] = useState<ApplicationTrackingStatus>(item.status);
  const [notes, setNotes] = useState<string>(item.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const deadlineInfo = calculateDeadlineInfo(scholarship);

  const completedChecklistCount = (item.checklist || []).filter((c) => c.completed).length;
  const totalChecklist = (item.checklist || []).length;

  const handleStatusChange = (newStatus: ApplicationTrackingStatus) => {
    setStatus(newStatus);
    updateSavedStatus(item.scholarshipId, newStatus);
  };

  const handleSaveNotes = () => {
    updateSavedNotes(item.scholarshipId, notes);
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all duration-200 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${deadlineInfo.badgeColor.bg} ${deadlineInfo.badgeColor.text} ${deadlineInfo.badgeColor.border}`}
            >
              {deadlineInfo.formattedDeadline}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Destination: <strong className="text-slate-800">{scholarship.destinationCountry}</strong>
            </span>
          </div>

          <h3
            onClick={() => onViewDetails(scholarship)}
            className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
          >
            {scholarship.title}
          </h3>
          <p className="text-xs text-slate-500">Provider: {scholarship.provider}</p>
        </div>

        {/* Status Switcher & Remove button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 text-xs">
            {(['Interested', 'Preparing', 'Applied'] as ApplicationTrackingStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                  status === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={onUnsave}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Remove from saved"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checklist Progress and Notes */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs">
        {/* Checklist toggle summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <span>Document Readiness Checklist ({completedChecklistCount}/{totalChecklist} completed)</span>
          </span>

          <button
            onClick={() => onViewDetails(scholarship)}
            className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
          >
            <span>View Full Details & Requirements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick checklist items */}
        {item.checklist && item.checklist.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {item.checklist.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => toggleChecklistItem(item.scholarshipId, c.id)}
                className="flex items-center gap-2 text-left p-1 rounded hover:bg-white transition-colors"
              >
                {c.completed ? (
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={c.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Notes input */}
        <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">My Application Notes:</span>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-[11px] text-teal-700 hover:underline"
              >
                {notes ? 'Edit Notes' : '+ Add Notes'}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write personal deadlines, professor contacts, essay drafts..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                rows={2}
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 italic">
              {notes || 'No personal notes added yet. Click "+ Add Notes" to jot down details.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
