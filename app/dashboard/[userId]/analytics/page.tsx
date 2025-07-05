// /app/(dashboard)/analytics/page.tsx

import { Metadata } from "next";
import { AnalyticsView } from "./_components/analytics-view";

export const metadata: Metadata = {
  title: "Analytics | Blutto",
  description: "View insights and statistics about your workspaces and tasks"
};

const AnalyticsPage = () => {
  return (
    <div className="w-full">
      <AnalyticsView />
    </div>
  );
};

export default AnalyticsPage;