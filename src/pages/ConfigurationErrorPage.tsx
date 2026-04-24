export function ConfigurationErrorPage({ error }: { error: string }) {
  return (
    <main className="centered-page">
      <section className="simple-panel">
        <p className="eyebrow">Konfiguracija</p>
        <h1>Konfiguracija aplikacije nije potpuna.</h1>
        <p className="muted-copy">
          Ovom deploy-u nedostaju Supabase environment varijable potrebne za pokretanje aplikacije.
        </p>
        <div className="status-message status-error">{error}</div>
        <div className="status-message status-info">
          Dodaj <strong>VITE_SUPABASE_URL</strong>, <strong>VITE_SUPABASE_ANON_KEY</strong> (ili{" "}
          <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong>) i <strong>VITE_SITE_URL</strong> na Vercelu,
          pa onda pokreni novi deploy.
        </div>
      </section>
    </main>
  );
}
