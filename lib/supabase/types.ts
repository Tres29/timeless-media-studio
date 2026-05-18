export type BookingStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "for_pick_up"
  | "completed"
  | "cancelled"
  
export type BookingRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  email_provider: string | null;
  booking_date: string;
  package_type: string;
  message: string | null;
  confirmation_number: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string | null;
};

export type BookingPayload = {
  name: string;
  phone: string;
  email: string;
  emailProvider?: string;
  date: string;
  packageType: string;
  message?: string;
  confirmationNumber?: string;
  status?: BookingStatus;
};
