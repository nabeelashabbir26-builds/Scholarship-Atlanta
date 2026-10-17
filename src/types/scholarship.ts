/**
 * Core Types for Scholarship Atlas
 */

export type VerificationStatus = 'Verified' | 'Pending Review' | 'Expired' | 'Rejected';

export type CoverageStatus = 'Covered' | 'Not Covered' | 'Unconfirmed';

export interface FundingCoverage {
  tuition: CoverageStatus;
  tuitionDetails?: string;
  stipend: CoverageStatus;
  stipendDetails?: string;
  accommodation: CoverageStatus;
  accommodationDetails?: string;
  travel: CoverageStatus;
  travelDetails?: string;
  healthInsurance: CoverageStatus;
  healthInsuranceDetails?: string;
  visaAllowance: CoverageStatus;
  visaAllowanceDetails?: string;
  otherBenefits?: string[];
  fundingExclusions?: string;
  bondingOrConditions?: string;
  isFullyFundedClaimVerified: boolean;
}

export type NationalityEligibilityMode = 'worldwide' | 'selected' | 'unknown';

export interface NationalityEligibility {
  mode: NationalityEligibilityMode;
  eligibleCountries?: string[];
  ineligibleCountries?: string[];
  notes?: string;
}

export type DegreeLevel = "Bachelor's" | "Master's" | "PhD" | "Postdoctoral" | "Research";

export interface Scholarship {
  id: string;
  isSampleRecord: boolean; // Distinguishes sample/test data from genuine verified listings
  title: string;
  provider: string; // Official provider/government body
  destinationCountry: string; // Where study takes place
  hostInstitutions?: string[]; // Universities or institutes
  degreeLevels: DegreeLevel[];
  subjects: string[]; // Academic fields / disciplines
  
  nationalityEligibility: NationalityEligibility;
  funding: FundingCoverage;
  
  academicRequirements: string[];
  languageRequirements?: string;
  requiredDocuments: string[];
  
  deadline: string | null; // ISO 8601 string or null if unconfirmed
  deadlineTimezone?: string; // Timezone designation, e.g., 'GMT', 'UTC', 'EST'
  deadlineNotConfirmed: boolean;
  academicYear: string;
  
  officialSourceUrl: string; // Mandatory official source
  officialApplicationUrl?: string; // Direct portal link
  lastCheckedDate: string; // ISO date 'YYYY-MM-DD'
  sourceCheckNotes?: string;
  
  verificationStatus: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  
  description: string;
  notesOrAdvice?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeadlineStatus = 'Open' | 'Closing Soon' | 'Closed' | 'Deadline Not Confirmed';

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysRemaining: number | null;
  formattedDeadline: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
}

export type ApplicationTrackingStatus = 'Interested' | 'Preparing' | 'Applied';

export interface SavedScholarshipItem {
  scholarshipId: string;
  status: ApplicationTrackingStatus;
  savedAt: string;
  notes?: string;
  checklist?: {
    id: string;
    label: string;
    completed: boolean;
  }[];
}

export interface FilterState {
  searchQuery: string;
  applicantNationality: string; // '' for any / worldwide
  destinationCountry: string;
  degreeLevels: DegreeLevel[];
  subjects: string[];
  fundingRequirements: {
    mustCoverTuition: boolean;
    mustCoverStipend: boolean;
    mustCoverTravel: boolean;
    mustCoverAccommodation: boolean;
    mustBeFullyFundedVerified: boolean;
  };
  deadlineFilter: 'all' | 'open_only' | 'closing_soon';
  includeExpired: boolean;
  onlyVerified: boolean;
  includeSampleRecords: boolean;
}
