// =============================================================================
// types/index.ts — Pathfinder UPMS shared TypeScript types
// Derived from the Phase 1+2 database schema.
// Import from here everywhere — never inline raw DB types.
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────
export type UserRole         = "parent" | "leader" | "admin" | "superadmin";
export type OnboardingStep   = "household_info" | "add_members" | "complete";
export type EnrollmentStatus = "active" | "inactive" | "pending" | "waitlist";
export type DocumentType     = "waiver" | "physical" | "bsa_app" | "other";
export type DocumentStatus   = "pending" | "signed" | "expired" | "rejected";
export type AlertType        =
  | "profile_update"
  | "medical_expiring"
  | "waiver_pending"
  | "low_balance"
  | "new_enrollment"
  | "document_uploaded";
export type AlertStatus = "unread" | "read" | "dismissed";

// ── Core Tables ──────────────────────────────────────────────────────────────
export interface Household {
  id:                       string;
  family_name:              string;
  address_line1:            string | null;
  address_line2:            string | null;
  city:                     string | null;
  state:                    string | null;
  zip:                      string | null;
  calendar_password:        string | null;
  emergency_contact_name:   string | null;
  emergency_contact_phone:  string | null;
  emergency_contact_rel:    string | null;
  created_at:               string;
  updated_at:               string;
}

export interface User {
  id:                       string;
  household_id:             string | null;
  role:                     UserRole;
  first_name:               string;
  last_name:                string;
  email:                    string;
  phone:                    string | null;
  relationship:             string | null;
  onboarding_step:          OnboardingStep;
  onboarding_completed_at:  string | null;
  created_at:               string;
  updated_at:               string;
}

export interface YouthMember {
  id:                   string;
  household_id:         string;
  first_name:           string;
  last_name:            string;
  preferred_name:       string | null;
  dob:                  string;               // ISO date string "YYYY-MM-DD"
  gender:               string | null;
  grade:                number | null;
  school_name:          string | null;
  shirt_size:           string | null;
  internal_notes:       string | null;        // Admin only
  known_allergies:      string | null;
  medications:          string | null;
  medical_alert_flag:   boolean;
  physical_expiration:  string | null;        // ISO date string
  created_at:           string;
  updated_at:           string;
}

export interface Program {
  id:          string;
  slug:        string;
  name:        string;
  short_name:  string;
  description: string | null;
  age_min:     number | null;
  age_max:     number | null;
  is_active:   boolean;
  sort_order:  number;
}

export interface Enrollment {
  id:         string;
  youth_id:   string;
  program_id: string;
  status:     EnrollmentStatus;
  join_date:  string;
  end_date:   string | null;
}

export interface Document {
  id:              string;
  youth_id:        string;
  type:            DocumentType;
  status:          DocumentStatus;
  title:           string | null;
  file_path:       string | null;
  file_hash:       string | null;
  signed_at:       string | null;
  expiration_date: string | null;
  template_id:     string | null;
  pushed_by:       string | null;
  signed_by:       string | null;
  notes:           string | null;
  created_at:      string;
  updated_at:      string;
}

export interface AdminAlert {
  id:           string;
  type:         AlertType;
  household_id: string | null;
  youth_id:     string | null;
  message:      string;
  status:       AlertStatus;
  created_at:   string;
  read_at:      string | null;
}

// ── Enriched / Joined Types (for UI) ─────────────────────────────────────────
export interface YouthWithEnrollments extends YouthMember {
  enrollments: Array<Enrollment & { program: Program }>;
  documents:   Document[];
}

export interface HouseholdWithMembers extends Household {
  members: YouthWithEnrollments[];
  users:   User[];
}

// ── Action Items (for the Action Center dashboard) ────────────────────────────
export type ActionItemKind =
  | "unsigned_waiver"
  | "missing_physical"
  | "expiring_physical"
  | "low_balance";

export interface ActionItem {
  id:          string;             // Stable key for React lists
  kind:        ActionItemKind;
  title:       string;             // "Sign Waiver" / "Upload Physical"
  description: string;
  youth:       Pick<YouthMember, "id" | "first_name" | "last_name">;
  href:        string;             // Where to go to resolve it
  urgency:     "high" | "medium" | "low";
  document?:   Document;
}

// ── Form Values ───────────────────────────────────────────────────────────────
export interface SignupFormValues {
  first_name: string;
  last_name:  string;
  email:      string;
  password:   string;
}

export interface HouseholdInfoFormValues {
  family_name:              string;
  address_line1:            string;
  address_line2?:           string;
  city:                     string;
  state:                    string;
  zip:                      string;
  phone:                    string;
  emergency_contact_name:   string;
  emergency_contact_phone:  string;
  emergency_contact_rel:    string;
  calendar_password:        string;
}

export interface AddYouthFormValues {
  first_name:      string;
  last_name:       string;
  dob:             string;
  gender?:         string;
  grade?:          number;
  school_name?:    string;
  shirt_size?:     string;
  program_ids:     string[];          // Array of program UUIDs
  known_allergies?: string;
  medications?:    string;
}
