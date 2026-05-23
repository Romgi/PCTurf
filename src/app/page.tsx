import { JobBoard } from "@/components/job-board";
import { getBoardData } from "@/lib/data";
import { normalizeDateKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const date = normalizeDateKey(params?.date);
  const data = await getBoardData(date);

  return <JobBoard data={data} showAdminLink showFullscreen />;
}
