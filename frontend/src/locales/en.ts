export interface Translations {
  // Common
  app_name: string;
  logout: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  submit: string;
  add: string;
  close: string;
  search: string;
  all: string;
  no_data: string;
  details: string;
  add_report: string;
  community_feed: string;
  upvote: string;
  upvotes: string;
  be_first_report: string;
  notifications: string;
  no_notifications: string;
  view_track_map: string;
  report_tracking: string;
  status: string;
  view_location: string;
  role_citizen: string;
  role_manager: string;
  role_technician: string;
  confirm_password: string;
  // Auth
  login: string;
  register: string;
  email: string;
  password: string;
  full_name: string;
  national_id: string;
  employee_id: string;
  phone: string;
  district: string;
  role: string;
  login_title: string;
  login_subtitle: string;
  register_title: string;
  register_subtitle: string;
  no_account: string;
  have_account: string;
  // Citizen
  citizen_dashboard: string;
  report_issue: string;
  my_reports: string;
  no_reports: string;
  category: string;
  urgency: string;
  address_description: string;
  before_photo: string;
  description: string;
  gps_coords: string;
  use_gps: string;
  update_gps: string;
  locating: string;
  gps_success: string;
  gps_error: string;
  contact_info: string;
  submit_report: string;
  duplicate_warning: string;
  follow_existing: string;
  submit_anyway: string;
  submitted_ok: string;
  select_category: string;
  describe_location_placeholder: string;
  contact: string;
  details_issue_placeholder: string;
  upload_image: string;
  paste_url: string;
  image_size_error: string;
  sla: string;
  // Manager
  manager_dashboard: string;
  all_reports: string;
  approve: string;
  reject: string;
  assign: string;
  assigning: string;
  no_technicians: string;
  select_technician: string;
  filter: string;
  filters: string;
  all_categories: string;
  all_technicians: string;
  all_statuses: string;
  assigned: string;
  city_heatmap: string;
  // Governor
  governor_dashboard: string;
  overview: string;
  reports: string;
  manage_users: string;
  manage_districts: string;
  categories: string;
  total_reports: string;
  resolved: string;
  in_progress: string;
  critical: string;
  avg_resolution: string;
  reports_by_category: string;
  add_district: string;
  district_name: string;
  add_category: string;
  category_name: string;
  priority: string;
  sla_hours: string;
  no_districts: string;
  no_categories: string;
  // Technician
  technician_dashboard: string;
  my_tasks: string;
  no_tasks: string;
  mark_resolved: string;
  closure_photo: string;
  resolving: string;
  upload_photo_first: string;
}

const en: Translations = {
  app_name: "UrbanFix",
  logout: "Logout",
  loading: "Loading…",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  submit: "Submit",
  add: "Add",
  close: "Close",
  search: "Search",
  all: "All",
  no_data: "No data found.",
  details: "Details",
  add_report: "Add Report",
  community_feed: "Community Feed",
  upvote: "Upvote",
  upvotes: "Upvotes",
  be_first_report: "No public reports in your area yet. Be the first to report!",
  notifications: "Notifications",
  no_notifications: "No notifications yet.",
  view_track_map: "View Track Map",
  report_tracking: "Report Tracking",
  status: "Status",
  view_location: "View Location",
  login: "Login",
  register: "Register",
  email: "Email",
  password: "Password",
  full_name: "Full Name",
  national_id: "National ID",
  employee_id: "Employee ID",
  phone: "Phone",
  district: "District",
  role: "Role",
  role_citizen: "Citizen",
  role_manager: "District Manager",
  role_technician: "Technician",
  confirm_password: "Confirm Password",
  login_title: "Welcome back",
  login_subtitle: "Sign in to your UrbanFix account",
  register_title: "Create account",
  register_subtitle: "Join UrbanFix to report urban issues",
  no_account: "Don't have an account?",
  have_account: "Already have an account?",
  citizen_dashboard: "Citizen Dashboard",
  report_issue: "Report an Issue",
  my_reports: "My Reports",
  no_reports: "No reports yet.",
  category: "Category",
  urgency: "Urgency",
  address_description: "Address Description",
  before_photo: "Before Photo (mandatory)",
  description: "Description",
  gps_coords: "GPS Coordinates",
  use_gps: "Use GPS",
  update_gps: "Update GPS",
  locating: "Locating…",
  gps_success: "GPS Location acquired!",
  gps_error: "Unable to retrieve your location.",
  contact_info: "Contact Info",
  submit_report: "Submit Report",
  duplicate_warning: "An issue has already been reported nearby. Follow it or submit anyway?",
  follow_existing: "Follow Existing",
  submit_anyway: "Submit Anyway",
  submitted_ok: "Report submitted!",
  select_category: "Select a category",
  describe_location_placeholder: "Describe location manually...",
  contact: "Contact:",
  details_issue_placeholder: "Details of the issue...",
  upload_image: "Upload",
  paste_url: "Paste URL",
  image_size_error: "Image must be under 2MB.",
  sla: "SLA",
  manager_dashboard: "Manager Dashboard",
  all_reports: "All Reports",
  approve: "Approve",
  reject: "Reject",
  assign: "Assign",
  assigning: "Assigning…",
  no_technicians: "No technicians in district",
  select_technician: "Select technician…",
  filter: "Filter",
  filters: "Filters",
  all_categories: "All Categories",
  all_technicians: "All Technicians",
  all_statuses: "All Statuses",
  assigned: "Assigned!",
  city_heatmap: "City Heatmap",
  governor_dashboard: "Governor Dashboard",
  overview: "Overview",
  reports: "Reports",
  manage_users: "Manage Users",
  manage_districts: "Manage Districts",
  categories: "Categories",
  total_reports: "Total Reports",
  resolved: "Resolved",
  in_progress: "In Progress",
  critical: "Critical",
  avg_resolution: "Avg Resolution (hrs)",
  reports_by_category: "Reports by Category",
  add_district: "Add District",
  district_name: "District Name",
  add_category: "Add Issue Category",
  category_name: "Name",
  priority: "Priority",
  sla_hours: "SLA (hours)",
  no_districts: "No districts found.",
  no_categories: "No categories.",
  technician_dashboard: "Technician Dashboard",
  my_tasks: "My Tasks",
  no_tasks: "No tasks assigned.",
  mark_resolved: "Mark as Resolved",
  closure_photo: "Closure Photo (mandatory)",
  resolving: "Resolving…",
  upload_photo_first: "Upload at least one photo before resolving.",
};

export default en;
