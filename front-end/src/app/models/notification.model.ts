export type NotificationType =
  | 'pickup_accepted'
  | 'pickup_assigned'
  | 'pickup_completed'
  | 'pickup_available'
  | 'complaint_resolved'
  | 'payment_confirmed'
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}