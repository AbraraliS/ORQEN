"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RoleBadge } from "@/components/layout/role-badge";
import { UsageMeter } from "@/components/layout/usage-meter";
import { useOrg } from "@/lib/auth/org-context";

export default function SettingsPage() {
  const { organization, members } = useOrg();

  if (!organization) return null;

  return (
    <AppShell title="Settings" crumbs={[{ label: "Settings" }]}>
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Usage</h2>
          <div className="mt-3">
            <UsageMeter usage={organization.usage} variant="full" />
          </div>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
            Members
          </h2>
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{member.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </span>
                <RoleBadge role={member.role} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
