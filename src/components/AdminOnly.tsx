import { useRouteContext, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function AdminOnly({ children }: { children: ReactNode }) {
  const { group } = useRouteContext({ from: "/_authenticated/_member" });
  if (group.role !== "admin") return <div className="py-20 text-center">Only group admins can see this page. <Link to="/board" className="underline">Back to the board</Link></div>;
  return <>{children}</>;
}
