import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "../backend.d";
import { useActor } from "./useActor";

export function useRole() {
  const { actor } = useActor();

  const { data: role } = useQuery<UserRole>({
    queryKey: ["userRole", !!actor],
    queryFn: async () => {
      if (!actor) return "guest" as UserRole;
      return actor.getCallerUserRole();
    },
    enabled: !!actor,
    staleTime: 30_000,
  });

  return {
    role: role ?? ("guest" as UserRole),
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "user",
    isStaff: role === "guest",
  };
}
