import { useEffect, useMemo, useState } from "react";
import { StatusBadge, Card, Table, EmptyState } from "@/components/ui/index";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/utils/helpers";
import { useAuth } from "@/context/AuthContext";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const safeStr = (v) => (v == null ? "" : String(v));
const firstNonEmpty = (...vals) => {
  for (const v of vals) {
    const s = safeStr(v).trim();
    if (s) return s;
  }
  return "";
};

const SESSION_STATUSES = ["Queue", "All", "SUBMITTED", "FLAGGED", "APPROVED", "REJECTED", "DRAFT", "EXPIRED"];

const badgeStatus = (s) => {
  const up = String(s || "").toUpperCase();
  if (up === "APPROVED") return "Approved";
  if (up === "REJECTED") return "Rejected";
  if (up === "FLAGGED") return "Under Review";
  if (up === "SUBMITTED") return "Pending";
  if (up === "DRAFT") return "Draft";
  if (up === "EXPIRED") return "Expired";
  return up || "—";
};

// Student fields (supports multiple shapes)
const getStudentName = (st) =>
  firstNonEmpty(st?.student_name, st?.name, st?.full_name, st?.fullName, st?.student?.name, st?.student?.full_name);
const getStudentUSN = (st) =>
  firstNonEmpty(st?.usn, st?.USN, st?.registration_no, st?.registration_number, st?.student?.usn, st?.student?.registration_no);
const getCollegeName = (st) =>
  firstNonEmpty(st?.college_name, st?.collegeName, st?.college, st?.student?.college_name, st?.student?.collegeName, st?.student?.college);

const extractPhotoUrls = (detail) => {
  const urls = [];
  const push = (u) => {
    const v = safeStr(u).trim();
    if (!v) return;
    if (!urls.includes(v)) urls.push(v);
  };

  const photos = detail?.photos;
  if (Array.isArray(photos)) {
    for (const p of photos) {
      if (typeof p === "string") push(p);
      else if (p && typeof p === "object") push(p.image_url ?? p.imageUrl ?? p.url ?? p.public_url);
    }
  }
  return urls;
};

// ------------------------------------------------------------
// Small UI bits
// ------------------------------------------------------------
const MiniCard = ({ label, value, borderVar }) => (
  <div className="glass rounded-xl p-4 border" style={{ borderColor: `var(${borderVar})` }}>
    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
      {value}
    </p>
    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
      {label}
    </p>
  </div>
);

const PillBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
    style={
      active
        ? {
            background: "var(--brand-600)/0.15",
            color: "var(--brand-400)",
            borderColor: "var(--brand-500)/0.3",
          }
        : { color: "var(--text-muted)", borderColor: "var(--border-base)" }
    }
  >
    {label}
  </button>
);

const FaceThumb = ({ url, matched, onClick }) => {
  if (!url) {
    return (
      <div className="flex flex-col">
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>—</span>
        <span className="mt-0.5" style={{ color: "var(--text-muted)" }}>
          —
        </span>
      </div>
    );
  }

  const label = matched == null ? "Processed" : matched ? "Matched" : "Mismatch";
  const borderColor = matched == null ? "var(--border-base)" : matched ? "var(--status-active-border)" : "#ef4444";

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg overflow-hidden border transition-transform hover:scale-[1.02]"
        style={{ borderColor }}
        title="Preview processed image"
      >
        <img src={url} alt="face-processed" className="w-12 h-12 object-cover" />
      </button>
      <div className="flex flex-col">
        <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{label}</span>
        <span className="mt-0.5" style={{ color: "var(--text-muted)" }}>
          {matched == null ? "—" : matched ? "Match found" : "No match"}
        </span>
      </div>
    </div>
  );
};

const AdminSessionsPage = () => {
  const { authFetch } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Queue");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // student cache
  const [studentById, setStudentById] = useState({});

  // detail drawer/modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);

  // photos modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activePhotos, setActivePhotos] = useState([]);

  // image preview modal (for face processed image)
  const [imgPreviewOpen, setImgPreviewOpen] = useState(false);
  const [imgPreviewUrl, setImgPreviewUrl] = useState("");
  const [imgPreviewTitle, setImgPreviewTitle] = useState("Image Preview");

  const openImagePreview = (url, title = "Image Preview") => {
    const u = safeStr(url).trim();
    if (!u) return;
    setImgPreviewUrl(u);
    setImgPreviewTitle(title);
    setImgPreviewOpen(true);
  };

  // ------------------------------------------------------------
  // API
  // ------------------------------------------------------------
  const fetchSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      // Queue = SUBMITTED + FLAGGED (backend default); so don't pass status
      if (statusFilter !== "Queue" && statusFilter !== "All") params.set("status", statusFilter);

      // q search on server (activity_name/session_code), still keep client search too
      if (search.trim()) params.set("q", search.trim());

      const url = `/admin/sessions${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await authFetch(url, { method: "GET" });
      const data = await res.json().catch(() => []);

      if (!res.ok) throw new Error(data?.detail || "Failed to load sessions");
      setSessions(Array.isArray(data) ? data : []);

      // hydrate students for visible list
      await hydrateStudentDetails(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const hydrateStudentDetails = async (items) => {
    const ids = Array.from(
      new Set(
        (items || [])
          .map((s) => Number(s?.student_id))
          .filter((x) => Number.isFinite(x) && x > 0)
      )
    );

    const missing = ids.filter((id) => !studentById[id]);
    if (missing.length === 0) return;

    // try bulk: /admin/students?ids=1,2,3
    try {
      const res = await authFetch(`/admin/students?ids=${missing.join(",")}`, { method: "GET" });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        setStudentById((prev) => {
          const next = { ...prev };
          for (const st of data) {
            const sid = Number(st?.id ?? st?.student_id);
            if (Number.isFinite(sid) && sid > 0) next[sid] = st;
          }
          return next;
        });
        return;
      }
    } catch {
      // ignore
    }

    // fallback single
    try {
      const results = await Promise.all(
        missing.map(async (id) => {
          const res = await authFetch(`/admin/students/${id}`, { method: "GET" });
          const data = await res.json().catch(() => null);
          if (!res.ok) return null;
          return data;
        })
      );

      setStudentById((prev) => {
        const next = { ...prev };
        for (const st of results.filter(Boolean)) {
          const sid = Number(st?.id ?? st?.student_id);
          if (Number.isFinite(sid) && sid > 0) next[sid] = st;
        }
        return next;
      });
    } catch {
      // ignore
    }
  };

  const openDetail = async (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await authFetch(`/admin/sessions/${sessionId}`, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to load session detail");

      setActiveDetail(data);

      // hydrate student
      const sid = Number(data?.student_id);
      if (Number.isFinite(sid) && sid > 0 && !studentById[sid]) {
        await hydrateStudentDetails([{ student_id: sid }]);
      }
    } catch (e) {
      setError(e?.message || "Failed to load session detail");
      setActiveDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openPhotos = (detail) => {
    const urls = extractPhotoUrls(detail);
    setActivePhotos(urls);
    setPhotoModalOpen(true);
  };

  const onApprove = async (sessionId) => {
    if (!confirm("Approve this submission?")) return;
    try {
      const res = await authFetch(`/admin/sessions/${sessionId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Approve failed");

      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: data?.status ?? "APPROVED" } : s)));
      setActiveDetail((p) => (p?.id === sessionId ? { ...p, status: data?.status ?? "APPROVED" } : p));
    } catch (e) {
      alert(e?.message || "Approve failed");
    }
  };

  const onReject = async (sessionId) => {
    const reason = prompt("Reject reason (required):");
    if (!reason) return;

    try {
      const res = await authFetch(`/admin/sessions/${sessionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Reject failed");

      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: data?.status ?? "REJECTED" } : s)));
      setActiveDetail((p) =>
        p?.id === sessionId ? { ...p, status: data?.status ?? "REJECTED", flag_reason: reason } : p
      );
    } catch (e) {
      alert(e?.message || "Reject failed");
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ------------------------------------------------------------
  // Derived
  // ------------------------------------------------------------
  const counts = useMemo(() => {
    const list = sessions || [];
    const norm = (x) => String(x || "").toUpperCase();
    return {
      total: list.length,
      submitted: list.filter((s) => norm(s.status) === "SUBMITTED").length,
      flagged: list.filter((s) => norm(s.status) === "FLAGGED").length,
      approved: list.filter((s) => norm(s.status) === "APPROVED").length,
      rejected: list.filter((s) => norm(s.status) === "REJECTED").length,
    };
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sessions;

    return (sessions || []).filter((s) => {
      const sid = Number(s?.student_id);
      const st = Number.isFinite(sid) ? studentById[sid] : null;

      const name = firstNonEmpty(getStudentName(st), s?.student_name);
      const usn = firstNonEmpty(getStudentUSN(st));
      const college = firstNonEmpty(getCollegeName(st));
      const faceReason = safeStr(s?.latest_face_reason);

      return [
        safeStr(s?.id),
        safeStr(s?.student_id),
        safeStr(s?.activity_name),
        safeStr(s?.activity_type_id),
        safeStr(s?.status),
        safeStr(name),
        safeStr(usn),
        safeStr(college),
        faceReason,
      ].some((v) => v.toLowerCase().includes(q));
    });
  }, [sessions, search, studentById]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Session Submissions
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Review submitted activities (ActivitySession) + face verification
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={fetchSessions}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--border-base)", color: "var(--text-muted)" }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg border text-sm"
          style={{
            borderColor: "var(--status-pending-border)",
            color: "var(--text-primary)",
            background: "var(--bg-card)",
          }}
        >
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MiniCard label="Total" value={counts.total} borderVar="--border-base" />
        <MiniCard label="Submitted" value={counts.submitted} borderVar="--status-pending-border" />
        <MiniCard label="Flagged" value={counts.flagged} borderVar="--status-review-border" />
        <MiniCard label="Approved" value={counts.approved} borderVar="--status-active-border" />
        <MiniCard label="Rejected" value={counts.rejected} borderVar="--status-review-border" />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          icon="search"
          placeholder="Search by student name/USN/college, session id, activity, status, face reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {SESSION_STATUSES.map((s) => (
            <PillBtn
              key={s}
              label={s === "Queue" ? "Queue (Submitted + Flagged)" : s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading sessions…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="activity" title="No sessions found" description="Adjust filters or search." />
        ) : (
          <Table headers={["Student", "Activity", "Submitted", "Face", "Status", "Actions"]}>
            {filtered.map((s) => {
              const sid = Number(s?.student_id);
              const st = Number.isFinite(sid) ? studentById[sid] : null;

              const name = firstNonEmpty(getStudentName(st), `Student #${s?.student_id ?? "—"}`);
              const usn = firstNonEmpty(getStudentUSN(st));
              const college = firstNonEmpty(getCollegeName(st));

              const processedUrl = s?.latest_face_processed_url || null;

              return (
                <tr key={s.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {name}
                      </span>
                      <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        USN: {usn || "—"}
                      </span>
                      <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        College: {college || "—"}
                      </span>
                      <span className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Student ID: {s?.student_id ?? "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <div className="flex flex-col">
                      <span className="font-medium">{s?.activity_name || `Activity #${s?.activity_type_id ?? "—"}`}</span>
                      <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Session #{s?.id} · Photos: {s?.photos_count ?? 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {s?.submitted_at ? formatDate(s.submitted_at) : "—"}
                  </td>

                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <div className="flex flex-col gap-1">
                      <FaceThumb
                        url={processedUrl}
                        matched={s?.latest_face_matched}
                        onClick={() => openImagePreview(processedUrl, `Session #${s?.id} · Face Processed`)}
                      />
                      {s?.latest_face_reason ? (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {s.latest_face_reason}
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          —
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={badgeStatus(s.status)} />
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: "var(--text-muted)" }}
                        onClick={() => openDetail(s.id)}
                        title="Open details"
                      >
                        <Icon name="external-link" size={14} />
                      </button>

                      {["SUBMITTED", "FLAGGED"].includes(String(s.status || "").toUpperCase()) && (
                        <>
                          <button
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => onApprove(s.id)}
                            title="Approve"
                          >
                            <Icon name="check" size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => onReject(s.id)}
                            title="Reject"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveSessionId(null);
          setActiveDetail(null);
        }}
        title={activeSessionId ? `Session #${activeSessionId}` : "Session"}
      >
        {detailLoading ? (
          <div className="p-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </div>
        ) : !activeDetail ? (
          <div className="p-2 text-sm" style={{ color: "var(--text-muted)" }}>
            No detail found.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {activeDetail.activity_name || `Activity #${activeDetail.activity_type_id ?? "—"}`}
                  </p>
                  {activeDetail.description ? (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {activeDetail.description}
                    </p>
                  ) : null}
                </div>
                <StatusBadge status={badgeStatus(activeDetail.status)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <div>Started: {activeDetail.started_at ? formatDate(activeDetail.started_at) : "—"}</div>
                <div>Expires: {activeDetail.expires_at ? formatDate(activeDetail.expires_at) : "—"}</div>
                <div>Submitted: {activeDetail.submitted_at ? formatDate(activeDetail.submitted_at) : "—"}</div>
                <div>Flag/Reject Reason: {activeDetail.flag_reason || "—"}</div>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => openPhotos(activeDetail)}
                  className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                  style={{ borderColor: "var(--border-base)", color: "var(--text-muted)" }}
                >
                  <Icon name="image" size={14} />
                  View Photos ({Array.isArray(activeDetail.photos) ? activeDetail.photos.length : 0})
                </button>

                {["SUBMITTED", "FLAGGED"].includes(String(activeDetail.status || "").toUpperCase()) && (
                  <>
                    <button
                      onClick={() => onApprove(activeDetail.id)}
                      className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                      style={{ borderColor: "var(--status-active-border)", color: "var(--text-primary)" }}
                    >
                      <Icon name="check" size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(activeDetail.id)}
                      className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                      style={{ borderColor: "#ef4444", color: "#ef4444" }}
                    >
                      <Icon name="x" size={14} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Face Check */}
            <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Face Verification
                </p>

                {activeDetail.latest_face_processed_url ? (
                  <button
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                    style={{ borderColor: "var(--border-base)", color: "var(--text-muted)" }}
                    onClick={() =>
                      openImagePreview(activeDetail.latest_face_processed_url, `Session #${activeDetail?.id} · Face Processed`)
                    }
                  >
                    <Icon name="image" size={14} />
                    Preview
                  </button>
                ) : null}
              </div>

              {!activeDetail.latest_face_check ? (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  No face check available for this session.
                </p>
              ) : (
                <div className="mt-2 space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="flex items-center justify-between">
                    <span>Matched</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                      {activeDetail.latest_face_check.matched ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>Cosine: {activeDetail.latest_face_check.cosine_score ?? "—"}</div>
                    <div>L2: {activeDetail.latest_face_check.l2_score ?? "—"}</div>
                    <div>Faces: {activeDetail.latest_face_check.total_faces ?? "—"}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Reason</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {activeDetail.latest_face_check.reason || "—"}
                    </span>
                  </div>

                  {/* Prefer backend-provided presigned URL */}
                  {activeDetail.latest_face_processed_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        openImagePreview(activeDetail.latest_face_processed_url, `Session #${activeDetail?.id} · Face Processed`)
                      }
                      className="mt-2 block w-full rounded-xl overflow-hidden border text-left"
                      style={{ borderColor: "var(--border-base)" }}
                      title="Preview processed image"
                    >
                      <img
                        src={activeDetail.latest_face_processed_url}
                        alt="processed"
                        className="w-full h-56 object-cover"
                      />
                    </button>
                  ) : activeDetail.latest_face_check.processed_object ? (
                    // Fallback only if processed_object is a usable URL (public). With private buckets, it won't work.
                    <a
                      href={activeDetail.latest_face_check.processed_object}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl overflow-hidden border mt-2"
                      style={{ borderColor: "var(--border-base)" }}
                      title="Open processed image"
                    >
                      <img
                        src={activeDetail.latest_face_check.processed_object}
                        alt="processed"
                        className="w-full h-56 object-cover"
                      />
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Photo Modal */}
      <Modal open={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title="Session Photos">
        {activePhotos.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No photos found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePhotos.map((url, idx) => (
              <a
                key={url + idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl overflow-hidden border"
                style={{ borderColor: "var(--border-base)" }}
              >
                <img src={url} alt={`photo-${idx + 1}`} className="w-full h-56 object-cover" />
              </a>
            ))}
          </div>
        )}
      </Modal>

      {/* Image Preview Modal (Face Processed) */}
      <Modal
        open={imgPreviewOpen}
        onClose={() => {
          setImgPreviewOpen(false);
          setImgPreviewUrl("");
          setImgPreviewTitle("Image Preview");
        }}
        title={imgPreviewTitle}
      >
        {!imgPreviewUrl ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No image available.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-base)" }}>
              <img src={imgPreviewUrl} alt="preview" className="w-full max-h-[70vh] object-contain bg-black/5" />
            </div>
            <div className="flex justify-end">
              <a
                href={imgPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                style={{ borderColor: "var(--border-base)", color: "var(--text-muted)" }}
              >
                <Icon name="external-link" size={14} />
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSessionsPage;