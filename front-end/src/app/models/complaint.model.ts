export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export type HouseholdIssueType =
  | 'late_pickup'
  | 'missed_pickup'
  | 'bad_service'
  | 'payment_issue'
  | 'other';

export type CollectorIssueType =
  | 'customer_unavailable'
  | 'wrong_address'
  | 'safety_issue'
  | 'other';

export type IssueType = HouseholdIssueType | CollectorIssueType;

export interface Complaint {
  id: string;
  userId: string;
  userRole: 'household' | 'collector';
  issueType: IssueType;
  pickupId?: string;
  message: string;
  status: ComplaintStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintRequest {
  issueType: IssueType;
  pickupId?: string;
  message: string;
}