import { apiServer } from "@/lib/api-server";
import type { StudyCycle } from "@/lib/types";
import { CycleEditorClient } from "./CycleEditorClient";

export default async function CycleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cycle } = await apiServer<{ cycle: StudyCycle }>(
    `/study-cycles/${encodeURIComponent(id)}`,
  );
  return <CycleEditorClient cycle={cycle} />;
}
