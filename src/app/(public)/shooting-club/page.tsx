import type { Metadata } from "next";
import ProgramPage from "@/components/ProgramPage";
import { getProgramBySlug } from "@/lib/programs";

const program = getProgramBySlug("shooting-club")!;

export const metadata: Metadata = {
  title: program.name,
  description: program.description,
};

export default function ShootingClubPage() {
  return <ProgramPage program={program} />;
}
