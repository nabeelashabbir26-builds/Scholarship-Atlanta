import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Clock,
  DollarSign,
  GraduationCap,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { DegreeLevel, FilterState } from '../types/scholarship';
import { POPULAR_STUDENT_NATIONALITIES } from '../utils/nationality';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
  onReset: () => void;
  totalMatches: number;
  totalOverall: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DESTINATION_COUNTRIES = [
  'All Destinations',
  'United Kingdom',
  'United States',
  'Germany',
  'Japan',
  'Sweden',
  'Switzerland',
  'Australia',
  'Brazil',
];

const DEGREE_OPTIONS: DegreeLevel[] = [
  "Bachelor's",
  "Master's",
  'PhD',
  'Postdoctoral',
  'Research',
];

const POPULAR_SUBJECTS = [
  'All Subjects',
  'STEM',
  'Engineering',
  'Social Sciences',
  'Economics',
  'Public Policy',
  'Public Health',
  'Medicine',
  'Environmental Sciences',
  'Law',
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  totalMatches,
  totalOverall,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDegreeToggle = (deg: DegreeLevel) => {
    const current = filters.degreeLevels;
    const exists = current.includes(deg);
    const updated = exists ? current.filter((d) => d !== deg) : [...current, deg];
    onChange({ ...filters, degreeLevels: updated });
  };

  const handleSubjectToggle = (subj: string) => {
    if (subj === 'All Subjects') {
      onChange({ ...filters, subjects: [] });
      return;
    }
    const current = filters.subjects;
    const exists = current.includes(subj);
    const updated = exists ? current.filter((s) => s !== subj) : [...current, subj];
    onChange({ ...filters, subjects: updated });
  };

  const handleFundingToggle = (key: keyof FilterState['fundingRequirements']) => {
    onChange({
      ...filters,
      fundingRequirements: {
        ...filters.fundingRequirements,
        [key]: !filters.fundingRequirements[key],
      },
    });
  };

  // Calculate number of active filters
  const activeCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.applicantNationality ? 1 : 0) +
    (filters.destinationCountry && filters.destinationCountry !== 'All Destinations' ? 1 : 0) +
    filters.degreeLevels.length +
    filters.subjects.length +
    (filters.fundingRequirements.mustBeFullyFundedVerified ? 1 : 0) +
    (filters.fundingRequirements.mustCoverTuition ? 1 : 0) +
    (filters.fundingRequirements.mustCoverStipend ? 1 : 0) +
    (filters.fundingRequirements.mustCoverTravel ? 1 : 0) +
    (filters.fundingRequirements.mustCoverAccommodation ? 1 : 0) +
    (filters.deadlineFilter !== 'all' ? 1 : 0) +
    (filters.includeExpired ? 1 : 0);

  const content = (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Header with Active Filters & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-600" />
          <span className="font-bold text-sm text-slate-900">Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold text-[11px]">
              {activeCount} active
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-slate-500 hover:text-teal-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Keyword Search */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-900 block">Keyword Search</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Scholarship name, field, university..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Applicant Nationality (Requirement 2) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>My Citizenship / Passport</span>
          </label>
        </div>
        <select
          value={filters.applicantNationality}
          onChange={(e) => onChange({ ...filters, applicantNationality: e.target.value })}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          <option value="">All / Worldwide (No restriction)</option>
          {POPULAR_STUDENT_NATIONALITIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 leading-tight">
          Filters scholarships where your nationality is explicitly eligible or open worldwide.
        </p>
      </div>

      {/* 3. Destination Country */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-900 block">Destination Country</label>
        <select
          value={filters.destinationCountry || 'All Destinations'}
          onChange={(e) =>
            onChange({
              ...filters,
              destinationCountry: e.target.value === 'All Destinations' ? '' : e.target.value,
            })
          }
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          {DESTINATION_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Degree Level */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div
          onClick={() => toggleSection('degrees')}
          className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 py-1"
        >
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>Degree Level</span>
          </span>
          {collapsedSections['degrees'] ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>

        {!collapsedSections['degrees'] && (
          <div className="space-y-1.5 pl-1">
            {DEGREE_OPTIONS.map((deg) => {
              const isChecked = filters.degreeLevels.includes(deg);
              return (
                <label
                  key={deg}
                  className="flex items-center gap-2.5 py-1 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleDegreeToggle(deg)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>{deg}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Funding Coverage Requirements (Requirement 1 & 5) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div
          onClick={() => toggleSection('funding')}
          className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 py-1"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
            <span>Funding Coverage</span>
          </span>
          {collapsedSections['funding'] ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>

        {!collapsedSections['funding'] && (
          <div className="space-y-2 pl-1">
            <label className="flex items-center gap-2.5 text-slate-800 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fundingRequirements.mustBeFullyFundedVerified}
                onChange={() => handleFundingToggle('mustBeFullyFundedVerified')}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-teal-800 font-semibold">
                Full Ride (Tuition + Stipend)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fundingRequirements.mustCoverTuition}
                onChange={() => handleFundingToggle('mustCoverTuition')}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>100% Tuition Fees Covered</span>
            </label>

            <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fundingRequirements.mustCoverStipend}
                onChange={() => handleFundingToggle('mustCoverStipend')}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Monthly Living Stipend Covered</span>
            </label>

            <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fundingRequirements.mustCoverTravel}
                onChange={() => handleFundingToggle('mustCoverTravel')}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>International Airfare Covered</span>
            </label>

            <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fundingRequirements.mustCoverAccommodation}
                onChange={() => handleFundingToggle('mustCoverAccommodation')}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Accommodation Covered</span>
            </label>
          </div>
        )}
      </div>

      {/* 6. Deadline Filter & Expired Toggle (Requirement 4) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="font-semibold text-slate-900 block flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Deadline Status</span>
        </label>

        <div className="space-y-1.5 pl-1">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="deadlineFilter"
              checked={filters.deadlineFilter === 'all'}
              onChange={() => onChange({ ...filters, deadlineFilter: 'all' })}
              className="text-teal-600 focus:ring-teal-500"
            />
            <span>All Active (Open & Unannounced)</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="deadlineFilter"
              checked={filters.deadlineFilter === 'open_only'}
              onChange={() => onChange({ ...filters, deadlineFilter: 'open_only' })}
              className="text-teal-600 focus:ring-teal-500"
            />
            <span>Open for Applications</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="deadlineFilter"
              checked={filters.deadlineFilter === 'closing_soon'}
              onChange={() => onChange({ ...filters, deadlineFilter: 'closing_soon' })}
              className="text-teal-600 focus:ring-teal-500"
            />
            <span className="text-rose-700 font-medium">Closing Soon (≤ 30 days)</span>
          </label>
        </div>

        {/* Expired Toggle (Requirement 4) */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeExpired}
              onChange={() => onChange({ ...filters, includeExpired: !filters.includeExpired })}
              className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
            />
            <span>Show closed / expired scholarships</span>
          </label>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Excluded by default to keep search focused on actionable opportunities.
          </p>
        </div>
      </div>

      {/* 7. Sample Records Display Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeSampleRecords}
            onChange={() =>
              onChange({ ...filters, includeSampleRecords: !filters.includeSampleRecords })
            }
            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span>Include sample / test records</span>
        </label>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Clearly marked with 🧪 for testing filters and edge cases.
        </p>
      </div>

      {/* Summary count */}
      <div className="pt-3 border-t border-slate-200 text-center text-slate-500 text-[11px]">
        Showing <strong>{totalMatches}</strong> of {totalOverall} scholarships
      </div>
    </div>
  );

  // Desktop sidebar
  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit sticky top-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
          onClick={onMobileClose}
        >
          <div
            className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <span className="font-bold text-base text-slate-900">Filters</span>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200">
              <button
                onClick={onMobileClose}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
              >
                Apply Filters ({totalMatches} Results)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
