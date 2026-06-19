import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { ComingSoon } from "./chat";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — BizLens AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <ComingSoon
        icon={<FileText className="h-7 w-7 text-white" />}
        title="Reports — coming next"
        description="Polished, printable PDF reports auto-generated from your data. Available in the next stage."
      />
    </AppShell>
  );
}
