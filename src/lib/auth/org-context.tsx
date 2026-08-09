"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery } from "@apollo/client";
import { useUserData, useAuthenticationStatus } from "@nhost/nextjs";
import { ORGANIZATIONS_QUERY } from "@/lib/graphql/documents";
import type { CurrentUser, Member, Organization, Role } from "@/types/organization";

type OrgContextValue = {
  user: CurrentUser | null;
  role: Role;
  organizations: Organization[];
  organization: Organization | null;
  members: Member[];
  switchOrganization: (id: string) => void;
  setRole: (role: Role) => void;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthenticationStatus();
  const nhostUser = useUserData();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [overrideRole, setRole] = useState<Role | null>(null);

  const { data, loading } = useQuery(ORGANIZATIONS_QUERY, {
    skip: !isAuthenticated,
  });

  const organizations = data?.organizations || [];

  useEffect(() => {
    if (organizations.length > 0 && !organizationId) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizations, organizationId]);

  const organization = useMemo(
    () => organizations.find((o: Organization) => o.id === organizationId) || null,
    [organizations, organizationId],
  );

  const switchOrganization = useCallback((id: string) => setOrganizationId(id), []);

  const dbRole = useMemo(() => {
    if (!organization || !nhostUser) return "viewer";
    const member = organization.members?.find((m: any) => m.user_id === nhostUser.id);
    return (member?.role as Role) || "viewer";
  }, [organization, nhostUser]);

  const role = overrideRole || dbRole;

  const value = useMemo<OrgContextValue>(
    () => ({
      user: nhostUser
        ? { id: nhostUser.id, name: nhostUser.displayName, email: nhostUser.email || "", role }
        : null,
      role,
      organizations,
      organization,
      members: organization?.members || [],
      switchOrganization,
      setRole,
    }),
    [nhostUser, role, organizations, organization, switchOrganization],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
