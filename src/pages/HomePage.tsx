import React, { useState } from 'react';
import {
  Search,
  Globe,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen,
  DollarSign,
  HeartHandshake,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { DegreeLevel, Scholarship } from '../types/scholarship';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { calculateDeadlineInfo } from '../utils/deadline';
import { POPULAR_STUDENT_NATIONALITIES } from '../utils/nationality';

interface HomePageProps {
  scholarships: Scholarship[];
  onViewDetails: (s: Scholarship) => void;
  onExploreFilter: (preset: {
    searchQuery?: string;
    applicantNationality?: string;
    destinationCountry?: string;
    degreeLevels?: DegreeLevel[];
    deadlineFilter?: 'all' | 'open_only' | 'closing_soon';
  }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  scholarships,
  onViewDetails,
  onExploreFilter,
}) => {
  const [heroSearch, setHeroSearch] = useState<string>('');
  const [heroNationality, setHeroNationality] = useState<string>('');
  const [heroDegree, setHeroDegree] = useState<string>('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExploreFilter({
      searchQuery: heroSearch,
      applicantNationality: heroNationality,
      degreeLevels: heroDegree ? [heroDegree as DegreeLevel] : [],
    });
  };

  // Urgent closing soon opportunities
  const closingSoonListings = scholarships.filter((s) => {
    const info = calculateDeadlineInfo(s);
    return info.status === 'Closing Soon' && !s.isSampleRecord;
  });

  // Featured verified opportunities
  const featuredListings = scholarships
    .filter((s) => s.verificationStatus === 'Verified' && !s.isSampleRecord)
    .slice(0, 4);

  // Recently updated / checked
  const recentlyChecked = [...scholarships]
    .filter((s) => !s.isSampleRecord)
    .sort((a, b) => b.lastCheckedDate.localeCompare(a.lastCheckedDate))
    .slice(0, 3);

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle geometric background motif */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>100% Free Access • Zero Fees • Verified Official Terms</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover Legitimate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300">
              Fully Funded Scholarships
            </span>{' '}
            Worldwide
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Transparent eligibility rules, detailed funding breakdowns, and direct links to official provider portals. Never pay for scholarship discovery.
          </p>

          {/* Quick Search & Filter Card */}
          <form
            onSubmit={handleHeroSubmit}
            className="bg-white p-3 sm:p-4 rounded-3xl shadow-2xl max-w-4xl mx-auto text-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs text-left"
          >
            {/* Search input */}
            <div className="sm:col-span-5 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search scholarship, country, field..."
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-medium"
              />
            </div>

            {/* Nationality dropdown */}
            <div className="sm:col-span-3">
              <select
                value={heroNationality}
                onChange={(e) => setHeroNationality(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-medium text-slate-700"
              >
                <option value="">Your Nationality (All)</option>
                {POPULAR_STUDENT_NATIONALITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Degree dropdown */}
            <div className="sm:col-span-2">
              <select
                value={heroDegree}
                onChange={(e) => setHeroDegree(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-medium text-slate-700"
              >
                <option value="">Degree (All)</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
                <option value="Research">Research</option>
              </select>
            </div>

            {/* Search button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Find Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick destination tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="text-slate-500">Popular Destinations:</span>
            {['United Kingdom', 'Germany', 'United States', 'Japan', 'Sweden', 'Switzerland'].map((dest) => (
              <button
                key={dest}
                onClick={() => onExploreFilter({ destinationCountry: dest })}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700/60"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Methodology Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verified Official Sources</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every listing includes a direct link to the provider’s government or university portal, and an audited last-checked timestamp. No fabricated claims.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Explicit Funding Breakdown</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We separate Tuition, Monthly Living Stipends, Flights, Housing, and Healthcare as Covered, Not Covered, or Unconfirmed so you know exactly what is funded.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Globe className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Accurate Nationality Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never assume you qualify because your country wasn’t excluded. Official eligible countries are strictly matched to protect your time and effort.
            </p>
          </div>
        </div>
      </section>

      {/* Urgent Closing Soon Opportunities (Requirement 4) */}
      {closingSoonListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-md bg-rose-50 text-rose-700">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Approaching Deadlines
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Closing Soon (Next 30 Days)
              </h2>
            </div>

            <button
              onClick={() => onExploreFilter({ deadlineFilter: 'closing_soon' })}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View all closing soon</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closingSoonListings.slice(0, 3).map((item) => (
              <ScholarshipCard
                key={item.id}
                scholarship={item}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Fully Funded Programs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-teal-50 text-teal-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Flagship Opportunities
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Verified Fully Funded Scholarships
            </h2>
          </div>

          <button
            onClick={() => onExploreFilter({})}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Explore all {scholarships.filter((s) => !s.isSampleRecord).length} opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {featuredListings.map((item) => (
            <ScholarshipCard
              key={item.id}
              scholarship={item}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </section>

      {/* Recently Checked Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Recently Audited & Verified
            </h2>
            <p className="text-xs text-slate-500">
              Opportunities regularly verified by our editorial administration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentlyChecked.map((item) => (
            <ScholarshipCard
              key={item.id}
              scholarship={item}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </section>

      {/* Student Integrity & Anti-Scam Advisory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden space-y-6">
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>International Student Advisory</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              How to Protect Yourself from Scholarship Scams
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Legitimate government and university scholarships never charge application fees, never guarantee selection in exchange for payment, and always require direct application through official institutional portals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <span className="font-bold text-teal-300 block">Rule #1: Zero Application Fees</span>
              <p className="text-slate-400 leading-relaxed">
                Legitimate schemes like Chevening, Fulbright, DAAD, and MEXT never ask for fees.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-teal-300 block">Rule #2: Verify the Domain</span>
              <p className="text-slate-400 leading-relaxed">
                Check that you are on official .gov, .edu, or accredited university domains.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-teal-300 block">Rule #3: Read the Bond Terms</span>
              <p className="text-slate-400 leading-relaxed">
                Some full scholarships require a 2-year return-to-home-country residency commitment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
