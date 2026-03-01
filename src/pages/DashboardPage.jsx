import React, { useEffect, useMemo, useState } from "react";
import { StatCard, Card, Table, StatusBadge } from "@/components/ui/index";
import { formatDate, pct } from "@/utils/helpers";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────
const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const DashboardPage = () => {
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalFaculty: 0,
    pendingFaculty: 0,
    totalActivities: 0,
    approvedActivities: 0,
    totalCertificates: 0,
    asOf: null,
  });

  const [categoryProgress, setCategoryProgress] = useState([]); // [{label,color,submitted,approved}]
  const [studentProgress, setStudentProgress] = useState([]);   // [{id,name,activities,certificates}]
  const [recentSubmissions, setRecentSubmissions] = useState([]); // [{id,student,title,category,submittedOn,status,certificate}]

  // CSS gradient strings for category progress bars
  const barColors = {
    emerald: "#10b981",
    pink: "#ec4899",
    blue: "var(--brand-500)",
    amber: "#f59e0b",
    slate: "#64748b",
  };

  const fetchAll = async () => {
    setLoading(true);
    setErr("");

    try {
      // ✅ Adjust these URLs to match your backend
      const [sRes, cRes, spRes, rRes] = await Promise.all([
        authFetch("/api/admin/dashboard/stats"),
        authFetch("/api/admin/dashboard/category-progress"),
        authFetch("/api/admin/dashboard/student-progress?limit=12"),
        authFetch("/api/admin/dashboard/recent-submissions?limit=6"),
      ]);

      if (!sRes.ok) throw new Error(`Stats failed (${sRes.status})`);
      if (!cRes.ok) throw new Error(`Category progress failed (${cRes.status})`);
      if (!spRes.ok) throw new Error(`Student progress failed (${spRes.status})`);
      if (!rRes.ok) throw new Error(`Recent submissions failed (${rRes.status})`);

      const s = await sRes.json();
      const c = await cRes.json();
      const sp = await spRes.json();
      const r = await rRes.json();

      setStats({
        totalStudents: safeNum(s.totalStudents),
        activeStudents: safeNum(s.activeStudents),
        totalFaculty: safeNum(s.totalFaculty),
        pendingFaculty: safeNum(s.pendingFaculty),
        totalActivities: safeNum(s.totalActivities),
        approvedActivities: safeNum(s.approvedActivities),
        totalCertificates: safeNum(s.totalCertificates),
        asOf: s.asOf || null,
      });

      setCategoryProgress(Array.isArray(c) ? c : []);
      setStudentProgress(Array.isArray(sp) ? sp : []);
      setRecentSubmissions(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryData = useMemo(() => {
    return categoryProgress.map((x) => {
      const submitted = safeNum(x.submitted ?? x.count ?? 0);
      const approved = safeNum(x.approved ?? 0);
      const p = pct(approved, submitted);
      return {
        label: x.label ?? x.category ?? "—",
        color: x.color ?? "slate",
        submitted,
        approved,
        p,
      };
    });
  }, [categoryProgress]);

  const certPctOfApproved = useMemo(() => {
    return pct(stats.totalCertificates, stats.approvedActivities);
  }, [stats.totalCertificates, stats.approvedActivities]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Platform Overview
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Live summary {stats.asOf ? `as of ${formatDate(stats.asOf)}` : "as of today"}
          </p>
        </div>

        <button
          onClick={fetchAll}
          className="text-sm px-3 py-2 rounded-lg border hover:bg-[var(--bg-card-hover)] transition"
          style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err ? (
        <div
          className="p-4 rounded-xl border"
          style={{ borderColor: "var(--border-base)", background: "var(--bg-card)" }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Couldn’t load dashboard
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {err}
          </div>
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          sub={`${stats.activeStudents} active`}
          icon="users"
          accent="brand"
          trend={8}
          index={0}
        />
        <StatCard
          label="Faculty Members"
          value={stats.totalFaculty}
          sub={`${stats.pendingFaculty} pending activation`}
          icon="faculty"
          accent="gold"
          index={1}
        />
        <StatCard
          label="Activities Submitted"
          value={stats.totalActivities}
          sub={`${stats.approvedActivities} approved`}
          icon="activity"
          accent="emerald"
          trend={14}
          index={2}
        />
        <StatCard
          label="Certificates Issued"
          value={stats.totalCertificates}
          sub={`${certPctOfApproved}% of approved`}
          icon="certificate"
          accent="amber"
          trend={5}
          index={3}
        />
      </div>

      {/* Progress panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Submission Progress by Category">
          <div className="p-5 space-y-4">
            {loading && categoryData.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading category progress…
              </div>
            ) : categoryData.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                No category data available.
              </div>
            ) : (
              categoryData.map(({ label, color, submitted, approved, p }) => (
                <div key={label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {label}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{approved}</span>/{submitted} approved
                      <span className="ml-2">({p}%)</span>
                    </span>
                  </div>

                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--border-base)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${p}%`,
                        background: barColors[color] || barColors.slate,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Certificate Progress per Student">
          <div className="p-5 space-y-4">
            {loading && studentProgress.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading student progress…
              </div>
            ) : studentProgress.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                No student progress available.
              </div>
            ) : (
              studentProgress
                .filter((s) => safeNum(s.activities) > 0)
                .map((s) => {
                  const activities = safeNum(s.activities);
                  const certificates = safeNum(s.certificates);
                  const p = pct(certificates, activities);

                  return (
                    <div key={s.id ?? s.student_id ?? s.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {s.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{certificates}</span>/{activities}
                          <span className="ml-1">({p}%)</span>
                        </span>
                      </div>

                      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--border-base)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${p}%`, background: "var(--brand-500)" }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card title="Recent Submissions">
        <Table headers={["Student", "Activity", "Category", "Submitted", "Status", "Certificate"]}>
          {loading && recentSubmissions.length === 0 ? (
            <tr>
              <td className="px-5 py-4 text-sm" colSpan={6} style={{ color: "var(--text-muted)" }}>
                Loading recent submissions…
              </td>
            </tr>
          ) : recentSubmissions.length === 0 ? (
            <tr>
              <td className="px-5 py-4 text-sm" colSpan={6} style={{ color: "var(--text-muted)" }}>
                No recent submissions.
              </td>
            </tr>
          ) : (
            recentSubmissions.map((a) => (
              <tr key={a.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {a.student}
                </td>
                <td className="px-5 py-3.5 text-sm max-w-[180px] truncate" style={{ color: "var(--text-secondary)" }}>
                  {a.title}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border"
                    style={{
                      background: "var(--bg-badge)",
                      color: "var(--text-secondary)",
                      borderColor: "var(--border-base)",
                    }}
                  >
                    {a.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(a.submittedOn)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={a.status} />
                </td>
                <td
                  className="px-5 py-3.5 text-xs"
                  style={{ color: a.certificate ? "var(--status-active-text)" : "var(--text-muted)" }}
                >
                  {a.certificate ? "✓ Issued" : "—"}
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
};

export default DashboardPage;