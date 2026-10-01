import type { Metadata } from "next";
import SkupWaitlist from "@/components/SkupWaitlist";
export const metadata: Metadata={title:"LUKMA — Waitlist",description:"Manage your LUKMA restaurant waitlist requests."};
export default function Page(){return <SkupWaitlist/>;}
