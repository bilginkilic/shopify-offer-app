import { Outlet } from "@remix-run/react";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Outlet />
    </div>
  );
}
