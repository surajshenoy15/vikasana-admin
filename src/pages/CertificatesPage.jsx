import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState } from "@/components/ui/index";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { formatDate, pct } from "@/utils/helpers";
import { useAuth } from "@/context/AuthContext";

const CertificatesPage = () => {
  const { authFetch } = useAuth();

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [total, setTotal] = useState(0);
  const [students, setStudents] = useState([]); // [{id,name,college,activities,certificates}]
  const [certs, setCerts] = useState([]);       // [{id,certificate_no,student,category,title,submittedOn}]

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const [sRes, cRes] = await Promise.all([
        authFetch("/api/admin/certificates/student-progress?limit=60"),
        authFetch("/api/admin/certificates?limit=500"),
      ]);

      if (!sRes.ok) throw new Error(`Student progress failed (${sRes.status})`);
      if (!cRes.ok) throw new Error(`Certificates list failed (${cRes.status})`);

      const s = await sRes.json();
      const c = await cRes.json();

      const studentRows = Array.isArray(s?.students) ? s.students : Array.isArray(s) ? s : [];
      const certRows = Array.isArray(c?.items) ? c.items : Array.isArray(c) ? c : [];

      setStudents(studentRows);
      setCerts(certRows);
      setTotal(Number(c?.total ?? certRows.length ?? 0));
    } catch (e) {
      setErr(e?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return certs;

    return certs.filter((c) => {
      const fields = [c.student, c.title, c.category, c.certificate_no].filter(Boolean);
      return fields.some((v) => String(v).toLowerCase().includes(q));
    });
  }, [certs, search]);

  const exportAll = async () => {
    try {
      const res = await authFetch("/api/admin/certificates/export");
      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "certificates.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || "Export failed");
    }
  };

  const downloadCert = async (certId) => {
    try {
      const res = await authFetch(`/api/admin/certificates/${certId}/download-url`);
      if (!res.ok) throw new Error(`Download link failed (${res.status})`);
      const data = await res.json();

      const url = data?.url;
      if (!url) throw new Error("No download URL returned");

      window.open(url, "_blank");
    } catch (e) {
      alert(e?.message || "Download failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Certificates
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} certificates issued`}
          </p>
          {err ? (
            <p className="text-sm mt-1" style={{ color: "var(--status-error-text)" }}>
              {err}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button icon="refresh" variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button icon="download" variant="secondary" onClick={exportAll} disabled={loading}>
            Export All
          </Button>
        </div>
      </div>

      <Card title="Per-Student Progress">
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && students.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              Loading student progress…
            </div>
          ) : students.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              No student progress available.
            </div>
          ) : (
            students.map((s) => {
              const p = pct(s.certificates, s.activities);
              return (
                <div
                  key={s.id}
                  className="glass glass-hover rounded-xl p-4 border"
                  style={{ borderColor: "var(--border-base)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {s.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {s.college || "—"}
                      </p>
                    </div>

                    <span className="text-2xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
                      {p}
                      <span className="text-base font-normal" style={{ color: "var(--text-muted)" }}>
                        %
                      </span>
                    </span>
                  </div>

                  <div
                    className="w-full rounded-full h-1.5 overflow-hidden"
                    style={{ background: "var(--border-base)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${p}%`,
                        background: p === 100 ? "var(--status-active-text)" : "var(--brand-500)",
                      }}
                    />
                  </div>

                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    {s.certificates} of {s.activities} certified
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
            Issued Certificates
          </h3>
          <Input
            icon="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="w-56"
          />
        </div>

        {loading && certs.length === 0 ? (
          <EmptyState icon="certificate" title="Loading certificates…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="certificate" title="No certificates found" />
        ) : (
          <div className="grid gap-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="glass glass-hover rounded-2xl p-4 border flex items-center gap-4"
                style={{ borderColor: "var(--border-base)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--gold-500)/0.10",
                    border: "1px solid var(--gold-500)/0.22",
                    color: "var(--gold-500)",
                  }}
                >
                  <Icon name="certificate" size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {c.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {c.student} · {c.category} · <span className="font-mono">{c.certificate_no}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {formatDate(c.submittedOn)}
                  </p>
                  <p
                    className="text-xs font-medium mt-0.5 flex items-center gap-1 justify-end"
                    style={{ color: "var(--status-active-text)" }}
                  >
                    <Icon name="check" size={11} /> Issued
                  </p>
                </div>

                <button
                  className="p-2 rounded-xl transition-all flex-shrink-0 hover:bg-[var(--bg-card-hover)]"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() => downloadCert(c.id)}
                  title="Download PDF"
                >
                  <Icon name="download" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;