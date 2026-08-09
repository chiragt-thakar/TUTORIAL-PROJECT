"use client";

import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";

export default function AccountPage() {
  const { session, syncEnabled, syncStatus, signUp, logIn, logOut } = useProgress();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = mode === "login" ? await logIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    else { setEmail(""); setPassword(""); }
  }

  return (
    <div className="standard-page account-page">
      <header className="page-header">
        <p className="eyebrow">ACCOUNT</p>
        <h1>Sync your progress across devices.</h1>
        <p>Optional. Progress always works locally with no account — this only mirrors it to your own Supabase project so it follows you to another browser or machine.</p>
      </header>

      {!syncEnabled && (
        <p className="planned-notice">
          Sync isn&apos;t configured on this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run <code>supabase/schema.sql</code> once in your Supabase
          project, and redeploy — your local progress is safe and untouched either way.
        </p>
      )}

      {syncEnabled && session && (
        <div className="account-card">
          <p className="eyebrow">SIGNED IN</p>
          <h2>{session.email}</h2>
          <p className="account-status">{syncStatus === "syncing" ? "Syncing…" : syncStatus === "error" ? "Last sync failed — will retry on the next change." : "Up to date."}</p>
          <button className="button secondary" type="button" onClick={logOut}>Sign out</button>
        </div>
      )}

      {syncEnabled && !session && (
        <form className="account-card account-form" onSubmit={handleSubmit}>
          <div className="account-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(null); }}>Sign in</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(null); }}>Create account</button>
          </div>
          <label>
            Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          {error && <p className="account-error">{error}</p>}
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>
          <p className="account-note">No password reset, no verification email — this is a plain, personal sync, by design. Don&apos;t reuse a real password here.</p>
        </form>
      )}
    </div>
  );
}
