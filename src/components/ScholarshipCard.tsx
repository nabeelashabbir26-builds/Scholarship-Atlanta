import React, { useState } from 'react';
import {
  Calendar,
  Globe,
  GraduationCap,
  CheckCircle2,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Plane,
  Home,
  ShieldAlert,
  ChevronRight,
  FileCheck2,
  DollarSign,
  HeartPulse,
  BadgeAlert,
  AlertCircle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { ApplicationTrackingStatus, Scholarship } from '../types/scholarship';
import { calculateDeadlineInfo } from '../utils/deadline';
import { checkNationalityEligibility } from '../utils/nationality';
import { isScholarshipSaved, saveScholarship, unsaveScholarship, getSavedItem } from '../utils/storage';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  selectedNationality?: string;
  onViewDetails: (scholarship: Scholarship) => void;
  onSavedChange?: () => void;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({
  scholarship,
  selectedNationality,
  onViewDetails,
  onSavedChange,
}) => {
  const [isSaved, setIsSaved] = useState<boolean>(() => isScholarshipSaved(scholarship.id));
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);
  const currentSavedItem = isSaved ? getSavedItem(scholarship.id) : null;

  const deadlineInfo = calculateDeadlineInfo(scholarship);
  const eligibility = checkNationalityEligibility(scholarship, selectedNationality);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveScholarship(scholarship.id);
      setIsSaved(false);
      setShowStatusMenu(false);
    } else {
      saveScholarship(scholarship.id, 'Interested');
      setIsSaved(true);
    }
    onSavedChange?.();
  };

  const handleStatusSelect = (status: ApplicationTrackingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    saveScholarship(scholarship.id, status);
    setIsSaved(true);
    setShowStatusMenu(false);
    onSavedChange?.();
  };

  const funding = scholarship.funding;

  return (
    <div
      onClick={() => onViewDetails(scholarship)}
      className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      <div>
        {/* Sample / Test Record Alert Banner */}
        {scholarship.isSampleRecord && (
          <div className="mb-4 -mx-1 -mt-1 px-3 py-1.5 bg-amber-500/10 border border-amber-300/60 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>🧪 <strong>Sample Test Record</strong> — Used for requirement verification</span>
            </span>
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Test Record
            </span>
          </div>
        )}

        {/* Top Badges: Verification Status & Deadline Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Verification Status */}
            {scholarship.verificationStatus === 'Verified' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Verified
              </span>
            )}
            {scholarship.verificationStatus === 'Pending Review' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pending Review
              </span>
            )}
            {scholarship.verificationStatus === 'Expired' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                Expired
              </span>
            )}
            {scholarship.verificationStatus === 'Rejected' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Rejected
              </span>
            )}

            {/* Fully Funded Claim Badge */}
            {funding.isFullyFundedClaimVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Full Ride (Verified)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                Partial / Tuition
              </span>
            )}
          </div>

          {/* Save / Tracker Button */}
          <div className="relative">
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isSaved
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200'
              }`}
              title={isSaved ? 'Saved in My Scholarships' : 'Save scholarship'}
              aria-label="Save scholarship"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-teal-600 text-teal-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Status change trigger if already saved */}
            {isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(!showStatusMenu);
                }}
                className="mt-1 block text-[10px] font-semibold text-teal-700 hover:text-teal-900 text-right underline underline-offset-2"
              >
                {currentSavedItem?.status || 'Saved'} ▾
              </button>
            )}

            {/* Saved Pipeline Status Dropdown */}
            {showStatusMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-11 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs"
              >
                <div className="px-3 py-1 font-semibold text-slate-400 uppercase text-[10px]">
                  Pipeline Status
                </div>
                {(['Interested', 'Preparing', 'Applied'] as ApplicationTrackingStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={(e) => handleStatusSelect(st, e)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 transition-colors ${
                        currentSavedItem?.status === st
                          ? 'font-bold text-teal-700 bg-teal-50/50'
                          : 'text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={(e) => {
                      handleToggleSave(e);
                      setShowStatusMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 text-rose-600 hover:bg-rose-50"
                  >
                    Remove from saved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title & Provider */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
            {scholarship.title}
          </h3>
          <p className="text-xs font-medium text-slate-600 mt-1">
            Provider: <span className="text-slate-800">{scholarship.provider}</span>
          </p>
        </div>

        {/* Destination & Degree Level */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-600 mb-4">
          <span className="flex items-center gap-1 font-medium text-slate-800">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Destination: <strong>{scholarship.destinationCountry}</strong></span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>{scholarship.degreeLevels.join(', ')}</span>
          </span>
        </div>

        {/* Nationality Eligibility Tag */}
        <div className="mb-4 max-w-full overflow-hidden">
          <div
            title={`${eligibility.statusLabel}: ${eligibility.details}`}
            className={`inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border ${eligibility.badgeStyle.bg} ${eligibility.badgeStyle.text} ${eligibility.badgeStyle.border}`}
          >
            <span className="font-semibold shrink-0">{eligibility.statusLabel}</span>
            <span className="text-slate-400 shrink-0">|</span>
            <span className="text-[11px] truncate min-w-0">
              {eligibility.details}
            </span>
          </div>
        </div>

        {/* Funding Coverage Matrix (Tuition, Stipend, Housing, Flights, Health, Visa) */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Funding Breakdown</span>
            <span className="text-[10px] text-slate-400 font-normal">Official verified terms</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Tuition */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.tuition} />
              <span className="text-slate-700 truncate">Tuition</span>
            </div>
            {/* Stipend */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.stipend} />
              <span className="text-slate-700 truncate">Living Stipend</span>
            </div>
            {/* Travel / Flights */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.travel} />
              <span className="text-slate-700 truncate">Flights</span>
            </div>
            {/* Accommodation */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.accommodation} />
              <span className="text-slate-700 truncate">Housing</span>
            </div>
            {/* Health Insurance */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.healthInsurance} />
              <span className="text-slate-700 truncate">Healthcare</span>
            </div>
            {/* Visa */}
            <div className="flex items-center gap-1.5">
              <CoverageIcon status={funding.visaAllowance} />
              <span className="text-slate-700 truncate">Visa Allowance</span>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {scholarship.description}
        </p>
      </div>

      {/* Footer Info: Deadline & Last-Checked Date */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Deadline info */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={`font-medium px-2 py-0.5 rounded text-[11px] border ${deadlineInfo.badgeColor.bg} ${deadlineInfo.badgeColor.text} ${deadlineInfo.badgeColor.border}`}
          >
            {deadlineInfo.formattedDeadline}
          </span>
        </div>

        {/* Last-checked and View Details CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-500">
          <span className="text-[11px] text-slate-400">
            Checked: <time dateTime={scholarship.lastCheckedDate}>{scholarship.lastCheckedDate}</time>
          </span>
          <span className="text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual coverage icon
const CoverageIcon: React.FC<{ status: 'Covered' | 'Not Covered' | 'Unconfirmed' }> = ({ status }) => {
  if (status === 'Covered') {
    return (
      <span title="Covered">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      </span>
    );
  }
  if (status === 'Not Covered') {
    return (
      <span title="Not Covered">
        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      </span>
    );
  }
  return (
    <span title="Unconfirmed / See details">
      <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    </span>
  );
};
