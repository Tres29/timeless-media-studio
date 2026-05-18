import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload - Timeless Media Studio",
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    // Malinis na lalabas ang page mo rito, walang haharang na Header o Footer
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#E5E5E5] to-[#4FACFE]bg-[#E5E5E5]">
      {children}
    </div>
  );
}