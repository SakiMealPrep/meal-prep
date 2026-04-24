export function ConfigurationErrorPage({ error }: { error: string }) {
  return (
    <main className="centered-page">
      <section className="simple-panel">
        <p className="eyebrow">Configuration</p>
        <h1>App configuration is incomplete.</h1>
        <p className="muted-copy">
          This deployment is missing the Supabase environment variables needed to start the app.
        </p>
        <div className="status-message status-error">{error}</div>
        <div className="status-message status-info">
          Add <strong>VITE_SUPABASE_URL</strong>, <strong>VITE_SUPABASE_ANON_KEY</strong> (or{" "}
          <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong>), and <strong>VITE_SITE_URL</strong> in Vercel,
          then redeploy.
        </div>
      </section>
    </main>
  );
}
