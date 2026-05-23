import { JobBoard } from "@/components/job-board";
import { requireAdmin } from "@/lib/auth";
import { getBoardData } from "@/lib/data";
import { normalizeDateKey } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Present",
};

type PresentPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function PresentPage({ searchParams }: PresentPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const date = normalizeDateKey(params?.date);
  const data = await getBoardData(date);

  return <JobBoard data={data} present showFullscreen />;
}
