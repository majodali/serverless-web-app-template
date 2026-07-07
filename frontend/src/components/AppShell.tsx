import { useState } from "react";
import type { PublicUser } from "../types";
import { ItemsView } from "./ItemsView";
import { AdminModal } from "./AdminModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { Diagnostics } from "./Diagnostics";

export function AppShell({
  user,
  appName,
  onLogout,
}: {
  user: PublicUser;
  appName: string;
  onLogout: () => void;
}) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">{appName}</div>
        <div className="topbar-actions">
          <span className="me">{user.displayName}</span>
          {user.role === "admin" && (
            <button className="text-btn" onClick={() => setShowAdmin(true)}>
              Admin
            </button>
          )}
          <button className="text-btn" onClick={() => setShowPassword(true)}>
            Password
          </button>
          <button className="text-btn" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <ItemsView />
      </main>

      {showAdmin && user.role === "admin" && (
        <AdminModal
          currentUserId={user.userId}
          onClose={() => setShowAdmin(false)}
          onOpenDiagnostics={() => {
            setShowAdmin(false);
            setShowDiagnostics(true);
          }}
        />
      )}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
      {showDiagnostics && user.role === "admin" && (
        <Diagnostics user={user} onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  );
}
