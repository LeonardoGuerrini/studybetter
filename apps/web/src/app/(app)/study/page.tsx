import { apiServer } from "@/lib/api-server";
import type { ActiveCycle, StudySession } from "@/lib/types";
import { StudyClient } from "./StudyClient";

const RECENT_QUERY = "/study-sessions?page=1&pageSize=6&status=FINISHED";

export default async function StudyPage() {
  const [cycleData, sessionData, recentData] = await Promise.all([
    apiServer<{ cycle: ActiveCycle | null }>("/study-cycles/active"),
    apiServer<{ session: StudySession | null }>("/study-sessions/active"),
    apiServer<{ sessions: StudySession[] }>(RECENT_QUERY),
  ]);

  return (
    <StudyClient
      initialCycle={cycleData.cycle}
      initialSession={sessionData.session}
      initialRecent={recentData.sessions}
    />
  );
}
