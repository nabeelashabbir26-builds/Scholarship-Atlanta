import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Globe,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Plane,
  Home,
  HeartPulse,
  DollarSign,
  Clock,
  Sparkles,
  Info,
  Building,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ApplicationTrackingStatus, DegreeLevel, Scholarship } from '../types/scholarship';
import { calculateDeadlineInfo } from '../utils/deadline';
import { checkNationalityEligibility, POPULAR_STUDENT_NATIONALITIES } from '../utils/nationality';
import {
  isScholarshipSaved,
  saveScholarship,
  unsaveScholarship,
  getSavedItem,
  updateSavedStatus,
  updateSavedNotes,
  toggleChecklistItem,
} from '../utils/storage';

interface ScholarshipDetailModalProps {
  scholarship: Scholarship | null;
  onClose: () => void;
  initialNationality?: string;
}

export const ScholarshipDetailModal: React.FC<ScholarshipDetailModalProps> = ({
  scholarship,
  onClose,
  initialNationality = '',
}) => {
  if (!scholarship) return null;

  const [testNationality, setTestNationality] = useState<string>(initialNationality);
  const [isSaved, setIsSaved] = useState<boolean>(() => isScholarshipSaved(scholarship.id));
  const [savedItem, setSavedItem] = useState(() => getSavedItem(scholarship.id));
  const [personalNotes, setPersonalNotes] = useState<string>(() => savedItem?.notes || '');
  const [notesSavedSuccess, setNotesSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const item = getSavedItem(scholarship.id);
    setIsSaved(!!item);
    setSavedItem(item);
    setPersonalNotes(item?.notes || '');
  }, [scholarship.id]);

  const deadlineInfo = calculateDeadlineInfo(scholarship);
  const eligibility = checkNationalityEligibility(scholarship, testNationality);
  const funding = scholarship.funding;

  const handleToggleSave = () => {
    if (isSaved) {
      unsaveScholarship(scholarship.id);
      setIsSaved(false);
      setSavedItem(undefined);
    } else {
      saveScholarship(scholarship.id, 'Interested');
      setIsSaved(true);
      setSavedItem(getSavedItem(scholarship.id));
    }
  };

  const handleStatusChange = (status: ApplicationTrackingStatus) => {
    updateSavedStatus(scholarship.id, status);
    setSavedItem(getSavedItem(scholarship.id));
  };

  const handleSaveNotes = () => {
    if (!isSaved) {
      saveScholarship(scholarship.id, 'Interested');
      setIsSaved(true);
    }
    updateSavedNotes(scholarship.id, personalNotes);
    setSavedItem(getSavedItem(scholarship.id));
    setNotesSavedSuccess(true);
    setTimeout(() => setNotesSavedSuccess(false), 2000);
  };

  const handleToggleChecklist = (checkId: string) => {
    toggleChecklistItem(scholarship.id, checkId);
    setSavedItem(getSavedItem(scholarship.id));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 sm:px-8 sm:py-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Verification Status */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                  scholarship.verificationStatus === 'Verified'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : scholarship.verificationStatus === 'Pending Review'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {scholarship.verificationStatus}
              </span>

              {funding.isFullyFundedClaimVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fully Funded Claim Verified
                </span>
              )}

              {scholarship.isSampleRecord && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-400 text-slate-950 font-mono">
                  🧪 SAMPLE TEST RECORD
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {scholarship.title}
            </h2>

            <p className="text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Provider: <strong>{scholarship.provider}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Destination: <strong>{scholarship.destinationCountry}</strong></span>
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 divide-y divide-slate-100">
          {/* Key Facts Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Degree Levels</span>
              <span className="font-bold text-slate-900 text-sm">
                {scholarship.degreeLevels.join(', ')}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Academic Year</span>
              <span className="font-bold text-slate-900 text-sm">{scholarship.academicYear}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Application Deadline</span>
              <span
                className={`inline-block font-bold px-2 py-0.5 rounded text-xs border ${deadlineInfo.badgeColor.bg} ${deadlineInfo.badgeColor.text} ${deadlineInfo.badgeColor.border}`}
              >
                {deadlineInfo.formattedDeadline}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Official Last Checked</span>
              <span className="font-bold text-slate-900 text-sm">{scholarship.lastCheckedDate}</span>
            </div>
          </div>

          {/* Official Verification & Source Banner (Mandatory Requirement 3) */}
          <div className="pt-6">
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>Official Provider Documentation</span>
                </div>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Last verified on <strong className="font-semibold">{scholarship.lastCheckedDate}</strong>.
                  {scholarship.sourceCheckNotes && ` ${scholarship.sourceCheckNotes}`}
                </p>
                <p className="text-[11px] text-teal-700/80 font-mono break-all">
                  {scholarship.officialSourceUrl}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <a
                  href={scholarship.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-teal-800 font-semibold text-xs border border-teal-300 rounded-xl shadow-xs transition-colors"
                >
                  <span>Official Guidelines</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {scholarship.officialApplicationUrl && (
                  <a
                    href={scholarship.officialApplicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Comprehensive Funding Breakdown Matrix (Requirement 5) */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Funding Coverage Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Each cost component is separately classified based on verified terms.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Covered
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Not Covered
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <HelpCircle className="w-3.5 h-3.5" /> Unconfirmed
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Cost Category</th>
                    <th className="py-3 px-4 w-32">Status</th>
                    <th className="py-3 px-4">Official Coverage Terms & Allowances</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Tuition Fees</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.tuition} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.tuitionDetails || 'Standard tuition coverage'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Living Stipend</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.stipend} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.stipendDetails || 'Monthly maintenance allowance'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">International Travel</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.travel} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.travelDetails || 'Round-trip economy flights'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Accommodation</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.accommodation} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.accommodationDetails || 'University housing or stipend subsidy'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Health Insurance</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.healthInsurance} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.healthInsuranceDetails || 'Student healthcare plan'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Visa & Arrival Allowance</td>
                    <td className="py-3 px-4">
                      <CoverageBadge status={funding.visaAllowance} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {funding.visaAllowanceDetails || 'Visa fee reimbursement or settlement grant'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Other benefits & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              {funding.otherBenefits && funding.otherBenefits.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-semibold text-slate-900 block">
                    Additional Included Benefits
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {funding.otherBenefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {funding.fundingExclusions && (
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
                  <span className="font-semibold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Important Exclusions
                  </span>
                  <p className="text-rose-800 leading-relaxed">{funding.fundingExclusions}</p>
                </div>
              )}

              {funding.bondingOrConditions && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 md:col-span-2">
                  <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    Conditions & Residency Obligations
                  </span>
                  <p className="text-amber-800 leading-relaxed">{funding.bondingOrConditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Nationality Eligibility Checker (Requirement 2) */}
          <div className="pt-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nationality Eligibility Checker
              </h3>
              <p className="text-xs text-slate-500">
                Check whether your passport / citizenship qualifies under official guidelines.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 shrink-0">
                  Select your country of citizenship:
                </label>
                <select
                  value={testNationality}
                  onChange={(e) => setTestNationality(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Nationality --</option>
                  {POPULAR_STUDENT_NATIONALITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {testNationality && (
                  <button
                    onClick={() => setTestNationality('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Status banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${eligibility.badgeStyle.bg} ${eligibility.badgeStyle.border}`}
              >
                {eligibility.isEligible === true && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {eligibility.isEligible === false && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                {eligibility.isEligible === null && (
                  <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className={`font-bold text-sm ${eligibility.badgeStyle.text}`}>
                    {eligibility.statusLabel}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{eligibility.details}</p>
                  {scholarship.nationalityEligibility.notes && (
                    <p className="text-slate-500 text-[11px] mt-1 italic">
                      Official note: {scholarship.nationalityEligibility.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Requirements & Required Documents */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Academic Requirements */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span>Academic & Eligibility Criteria</span>
              </h4>
              <ul className="space-y-2 text-slate-600">
                {scholarship.academicRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>

              {scholarship.languageRequirements && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Language Requirements:
                  </span>
                  <span className="text-slate-600">{scholarship.languageRequirements}</span>
                </div>
              )}
            </div>

            {/* Required Documents */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Required Application Documents</span>
              </h4>
              <ul className="space-y-2 text-slate-600">
                {scholarship.requiredDocuments.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Student Application Pipeline & Notes (Requirement 6) */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  My Application Pipeline & Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Save this opportunity and manage your application progress locally.
                </p>
              </div>
              <button
                onClick={handleToggleSave}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-teal-600" />
                    <span>Saved in My Scholarships</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    <span>Save Scholarship</span>
                  </>
                )}
              </button>
            </div>

            {isSaved && savedItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
                {/* Pipeline Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Application Status:</span>
                  <div className="inline-flex rounded-xl p-0.5 bg-slate-200">
                    {(['Interested', 'Preparing', 'Applied'] as ApplicationTrackingStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            savedItem.status === status
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Checklist */}
                {savedItem.checklist && (
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 block">Document Milestones:</span>
                    <div className="space-y-1.5">
                      {savedItem.checklist.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklist(item.id)}
                          className="flex items-center gap-2.5 w-full text-left p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={
                              item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                            }
                          >
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Notes */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="font-semibold text-slate-700 block">
                    Personal Application Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="e.g. Professor contacted, reference letter deadline Nov 1st..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs text-slate-800"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
                    >
                      Save Notes
                    </button>
                    {notesSavedSuccess && (
                      <span className="text-teal-600 font-medium text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Notes saved to local storage
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 px-6 py-4 sm:px-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Source URL: <span className="font-mono">{new URL(scholarship.officialSourceUrl).hostname}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Close
            </button>

            {scholarship.officialApplicationUrl && (
              <a
                href={scholarship.officialApplicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                <span>Official Application Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CoverageBadge: React.FC<{ status: 'Covered' | 'Not Covered' | 'Unconfirmed' }> = ({
  status,
}) => {
  if (status === 'Covered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Covered
      </span>
    );
  }
  if (status === 'Not Covered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-rose-50 text-rose-800 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        Not Covered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
      <HelpCircle className="w-3 h-3 text-amber-600" />
      Unconfirmed
    </span>
  );
};
