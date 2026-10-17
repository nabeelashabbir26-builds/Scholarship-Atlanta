import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  GraduationCap,
  Globe,
  Clock,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { FilterState, Scholarship, DegreeLevel } from '../types/scholarship';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { calculateDeadlineInfo, isScholarshipOpen } from '../utils/deadline';
import { checkNationalityEligibility } from '../utils/nationality';

interface ExplorePageProps {
  scholarships: Scholarship[];
  filters: FilterState;
  onFilterChange: (updated: FilterState) => void;
  onResetFilters: () => void;
  onViewDetails: (s: Scholarship) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  scholarships,
  filters,
  onFilterChange,
  onResetFilters,
  onViewDetails,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'deadline_soonest' | 'recently_checked' | 'name'>('deadline_soonest');

  // Filter matching logic ensuring multi-filter AND intersection
  const matchingScholarships = useMemo(() => {
    return scholarships.filter((scholarship) => {
      // 1. Keyword search (title, provider, destination, subjects, description)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const titleMatch = scholarship.title.toLowerCase().includes(query);
        const providerMatch = scholarship.provider.toLowerCase().includes(query);
        const destinationMatch = scholarship.destinationCountry.toLowerCase().includes(query);
        const subjectMatch = scholarship.subjects.some((subj) => subj.toLowerCase().includes(query));
        const descMatch = scholarship.description.toLowerCase().includes(query);

        if (!titleMatch && !providerMatch && !destinationMatch && !subjectMatch && !descMatch) {
          return false;
        }
      }

      // 2. Sample records toggle
      if (!filters.includeSampleRecords && scholarship.isSampleRecord) {
        return false;
      }

      // 3. Expired listings handling (Requirement 4: Exclude expired by default unless requested)
      const deadlineInfo = calculateDeadlineInfo(scholarship);
      const isExpiredOrClosed = deadlineInfo.status === 'Closed' || scholarship.verificationStatus === 'Expired';

      if (!filters.includeExpired && isExpiredOrClosed) {
        return false;
      }

      // 4. Deadline filter
      if (filters.deadlineFilter === 'open_only') {
        if (deadlineInfo.status !== 'Open' && deadlineInfo.status !== 'Closing Soon') {
          return false;
        }
      } else if (filters.deadlineFilter === 'closing_soon') {
        if (deadlineInfo.status !== 'Closing Soon') {
          return false;
        }
      }

      // 5. Applicant Nationality (Requirement 2: Strictly match eligibility)
      if (filters.applicantNationality) {
        const eligibility = checkNationalityEligibility(scholarship, filters.applicantNationality);
        // Only keep if explicitly eligible
        if (eligibility.isEligible !== true) {
          return false;
        }
      }

      // 6. Destination Country
      if (filters.destinationCountry && filters.destinationCountry !== 'All Destinations') {
        if (scholarship.destinationCountry !== filters.destinationCountry) {
          return false;
        }
      }

      // 7. Degree Level (Matches any of selected degree levels)
      if (filters.degreeLevels.length > 0) {
        const hasMatchingDegree = filters.degreeLevels.some((deg) =>
          scholarship.degreeLevels.includes(deg)
        );
        if (!hasMatchingDegree) {
          return false;
        }
      }

      // 8. Subjects
      if (filters.subjects.length > 0) {
        const hasSubject = scholarship.subjects.some(
          (s) => s === 'All Subjects' || filters.subjects.includes(s)
        );
        if (!hasSubject) {
          return false;
        }
      }

      // 9. Funding Coverage Requirements (Requirement 1 & 5)
      const funding = scholarship.funding;

      if (filters.fundingRequirements.mustBeFullyFundedVerified) {
        if (!funding.isFullyFundedClaimVerified) {
          return false;
        }
      }

      if (filters.fundingRequirements.mustCoverTuition) {
        if (funding.tuition !== 'Covered') {
          return false;
        }
      }

      if (filters.fundingRequirements.mustCoverStipend) {
        if (funding.stipend !== 'Covered') {
          return false;
        }
      }

      if (filters.fundingRequirements.mustCoverTravel) {
        if (funding.travel !== 'Covered') {
          return false;
        }
      }

      if (filters.fundingRequirements.mustCoverAccommodation) {
        if (funding.accommodation !== 'Covered') {
          return false;
        }
      }

      return true;
    });
  }, [scholarships, filters]);

  // Sort matching scholarships
  const sortedScholarships = useMemo(() => {
    return [...matchingScholarships].sort((a, b) => {
      if (sortBy === 'deadline_soonest') {
        // Prioritize open scholarships with deadlines
        const aInfo = calculateDeadlineInfo(a);
        const bInfo = calculateDeadlineInfo(b);

        // Put active closing soon first
        if (aInfo.status === 'Closing Soon' && bInfo.status !== 'Closing Soon') return -1;
        if (bInfo.status === 'Closing Soon' && aInfo.status !== 'Closing Soon') return 1;

        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        return 0;
      }

      if (sortBy === 'recently_checked') {
        return b.lastCheckedDate.localeCompare(a.lastCheckedDate);
      }

      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });
  }, [matchingScholarships, sortBy]);

  // Dismiss individual active filters
  const removeFilterTag = (type: string, value?: string) => {
    if (type === 'search') {
      onFilterChange({ ...filters, searchQuery: '' });
    } else if (type === 'nationality') {
      onFilterChange({ ...filters, applicantNationality: '' });
    } else if (type === 'destination') {
      onFilterChange({ ...filters, destinationCountry: '' });
    } else if (type === 'degree' && value) {
      onFilterChange({
        ...filters,
        degreeLevels: filters.degreeLevels.filter((d) => d !== value),
      });
    } else if (type === 'deadline') {
      onFilterChange({ ...filters, deadlineFilter: 'all' });
    } else if (type === 'funding' && value) {
      onFilterChange({
        ...filters,
        fundingRequirements: {
          ...filters.fundingRequirements,
          [value]: false,
        },
      });
    } else if (type === 'expired') {
      onFilterChange({ ...filters, includeExpired: false });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Explore Verified Scholarships
          </h1>
          <p className="text-xs text-slate-500">
            Filter by your nationality, destination, degree, and specific funding coverage elements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="deadline_soonest">Deadline (Soonest first)</option>
              <option value="recently_checked">Recently Verified</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Active Filter Tags Bar */}
      {(filters.applicantNationality ||
        filters.destinationCountry ||
        filters.searchQuery ||
        filters.degreeLevels.length > 0 ||
        filters.fundingRequirements.mustBeFullyFundedVerified ||
        filters.fundingRequirements.mustCoverStipend ||
        filters.fundingRequirements.mustCoverTuition ||
        filters.fundingRequirements.mustCoverTravel ||
        filters.fundingRequirements.mustCoverAccommodation ||
        filters.deadlineFilter !== 'all' ||
        filters.includeExpired) && (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-slate-500 font-medium mr-1">Active Filters:</span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              <span>Keyword: "{filters.searchQuery}"</span>
              <button onClick={() => removeFilterTag('search')}>
                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </button>
            </span>
          )}

          {filters.applicantNationality && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-medium">
              <span>Citizen of {filters.applicantNationality}</span>
              <button onClick={() => removeFilterTag('nationality')}>
                <X className="w-3 h-3 text-teal-600 hover:text-teal-900" />
              </button>
            </span>
          )}

          {filters.destinationCountry && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              <span>Destination: {filters.destinationCountry}</span>
              <button onClick={() => removeFilterTag('destination')}>
                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </button>
            </span>
          )}

          {filters.degreeLevels.map((deg) => (
            <span
              key={deg}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
            >
              <span>{deg}</span>
              <button onClick={() => removeFilterTag('degree', deg)}>
                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </button>
            </span>
          ))}

          {filters.fundingRequirements.mustBeFullyFundedVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              <span>Full Ride (Verified)</span>
              <button onClick={() => removeFilterTag('funding', 'mustBeFullyFundedVerified')}>
                <X className="w-3 h-3 text-emerald-600" />
              </button>
            </span>
          )}

          {filters.fundingRequirements.mustCoverStipend && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              <span>Must Cover Stipend</span>
              <button onClick={() => removeFilterTag('funding', 'mustCoverStipend')}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}

          {filters.fundingRequirements.mustCoverTuition && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              <span>Must Cover Tuition</span>
              <button onClick={() => removeFilterTag('funding', 'mustCoverTuition')}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}

          {filters.fundingRequirements.mustCoverTravel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              <span>Must Cover Flights</span>
              <button onClick={() => removeFilterTag('funding', 'mustCoverTravel')}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}

          {filters.deadlineFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
              <span>
                {filters.deadlineFilter === 'open_only' ? 'Open Only' : 'Closing Soon (≤ 30d)'}
              </span>
              <button onClick={() => removeFilterTag('deadline')}>
                <X className="w-3 h-3 text-rose-600" />
              </button>
            </span>
          )}

          {filters.includeExpired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
              <span>Including Expired</span>
              <button onClick={() => removeFilterTag('expired')}>
                <X className="w-3 h-3 text-slate-500" />
              </button>
            </span>
          )}

          <button
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Results */}
      <div className="flex items-start gap-8">
        {/* Desktop Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={onFilterChange}
          onReset={onResetFilters}
          totalMatches={matchingScholarships.length}
          totalOverall={scholarships.length}
          isMobileOpen={mobileFilterOpen}
          onMobileClose={() => setMobileFilterOpen(false)}
        />

        {/* Scholarships Content Area */}
        <div className="flex-1 space-y-6">
          {sortedScholarships.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  No scholarships match all selected criteria
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In accordance with strict eligibility rules, we only show opportunities where all filters intersect. Try widening your criteria or selecting "Worldwide / All Nationalities".
                </p>
              </div>
              <button
                onClick={onResetFilters}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedScholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                  selectedNationality={filters.applicantNationality}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
