export type Role = "owner" | "editor" | "viewer";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "team" | "enterprise";
  usage: {
    runsUsed: number;
    runsQuota: number;
    periodEnd: string;
  };
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  lastActiveAt: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** role within the currently selected organization */
  role: Role;
};
