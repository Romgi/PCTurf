import { JobBoard } from "@/components/job-board";
import { PresentLobby } from "@/components/present-lobby";
import { requireAdmin } from "@/lib/auth";
import { getBoardData } from "@/lib/data";
import { normalizeDateKey } from "@/lib/dates";
import { getPresentationSlides } from "@/lib/slides";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Present",
};

type PresentPageProps = {
  searchParams?: Promise<{
    date?: string;
    view?: string;
  }>;
};

export default async function PresentPage({ searchParams }: PresentPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const date = normalizeDateKey(params?.date);
  const boardData = getBoardData(date);

  if (params?.view === "jobs") {
    return <JobBoard data={await boardData} showFullscreen />;
  }

  const [data, slides] = await Promise.all([boardData, getPresentationSlides()]);

  return <PresentLobby date={date} slides={slides} weather={data.weatherReport} />;
}
