import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRole } from "../hooks/useRole";

export default function Users() {
  const { actor } = useActor();
  const { isAdmin } = useRole();
  const qc = useQueryClient();
  const { identity } = useInternetIdentity();

  const roleMut = useMutation({
    mutationFn: ({ user, role }: { user: Principal; role: UserRole }) =>
      actor!.assignCallerUserRole(user, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRole"] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center gap-3"
        data-ocid="users.page"
      >
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const principal = identity?.getPrincipal();

  return (
    <div className="space-y-4" data-ocid="users.page">
      <div>
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-mono break-all text-muted-foreground">
            {principal?.toText()}
          </p>
          <div>
            <p className="text-sm font-medium mb-1">Assign Role</p>
            <Select
              onValueChange={(v) =>
                principal &&
                roleMut.mutate({ user: principal, role: v as UserRole })
              }
            >
              <SelectTrigger data-ocid="users.role.select" className="w-48">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Manager</SelectItem>
                <SelectItem value="guest">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            To assign roles to other users, they must first sign in so their
            principal is registered. Share the app URL and have them log in,
            then use this page to manage their access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
