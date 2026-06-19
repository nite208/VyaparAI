import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { ComingSoon } from "./chat";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — BizLens AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <ComingSoon
        icon={<SettingsIcon className="h-7 w-7 text-white" />}
        title="Settings — coming next"
        description="AI configuration, data management, and app preferences arrive with the chat build."
      />
    </AppShell>
  );
}
