import { useEffect, useMemo, useState } from "react";
import { StatusBadge, Card, Table, EmptyState } from "@/components/ui/index";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/utils/helpers";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const EVENT_STATUSES = ["All", "approved", "submitted", "rejected", "in_progress", "expired"];
const SESSION_STATUSES = ["Queue", "All", "SUBMITTED", "FLAGGED", "APPROVED", "REJECTED", "DRAFT", "EXPIRED"];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));

const firstNonEmpty = (...vals) => {
  for (const v of vals) {
    const s = safeStr(v).trim();
    if (s) return s;
  }
  return "";
};

const eventStatusToUi = (s) => {
  if (s === "approved") return "Approved";
  if (s === "submitted") return "Pending";
  if (s === "in_progress") return "In Progress";
  if (s === "expired") return "Expired";
  if (s === "rejected") return "Rejected";
  return s ?? "—";
};

const sessionBadgeStatus = (s) => {
  const up = String(s || "").toUpperCase();
  if (up === "APPROVED") return "Approved";
  if (up === "REJECTED") return "Rejected";
  if (up === "FLAGGED") return "Under Review";
  if (up === "SUBMITTED") return "Pending";
  if (up === "DRAFT") return "Draft";
  if (up === "EXPIRED") return "Expired";
  return up || "—";
};

const fmtTime = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "—";
  }
};

const fmtDuration = (hrs) => {
  if (hrs == null || isNaN(hrs)) return "—";
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const googleMapsUrl = (lat, lng) =>
  lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;

const getStudentName = (s) =>
  firstNonEmpty(s?.student_name, s?.studentName, s?.student?.name, s?.student?.full_name, s?.name, s?.full_name);
const getStudentUSN = (s) =>
  firstNonEmpty(s?.student_usn, s?.usn, s?.student?.usn, s?.registration_no, s?.student?.registration_no);
const getCollegeName = (s) =>
  firstNonEmpty(s?.college_name, s?.college, s?.student?.college_name, s?.student?.college);

const extractPhotoUrls = (submission) => {
  const urls = [];
  const push = (u) => {
    const v = safeStr(u).trim();
    if (v && !urls.includes(v)) urls.push(v);
  };
  for (const arr of [submission?.photos, submission?.photo_urls, submission?.images]) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (typeof item === "string") push(item);
      else if (item) push(item.image_url ?? item.url ?? item.photo_url ?? item.public_url);
    }
  }
  return urls;
};

// ─────────────────────────────────────────────────────────────
// Shared small components (design like your Students page)
// ─────────────────────────────────────────────────────────────

const TopPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
    style={
      active
        ? {
            background: "var(--brand-600)/0.12",
            color: "var(--brand-400)",
            borderColor: "var(--brand-500)/0.35",
          }
        : { color: "var(--text-muted)", borderColor: "transparent", background: "transparent" }
    }
  >
    {label}
  </button>
);

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
        ? { background: "var(--brand-600)/0.15", color: "var(--brand-400)", borderColor: "var(--brand-500)/0.3" }
        : { color: "var(--text-muted)", borderColor: "var(--border-base)" }
    }
  >
    {label}
  </button>
);

const ActivityTag = ({ label, onRemove }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
    style={{ background: "var(--bg-card)", borderColor: "var(--border-base)", color: "var(--text-secondary)" }}
  >
    {label}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 opacity-60 hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
      >
        ×
      </button>
    )}
  </span>
);

const InfoRow = ({ label, value, href }) => (
  <div
    className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0"
    style={{ borderColor: "var(--border-base)" }}
  >
    <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 130 }}>
      {label}
    </span>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium underline truncate"
        style={{ color: "var(--brand-400)" }}
      >
        {value || "—"}
      </a>
    ) : (
      <span className="text-xs font-medium text-right" style={{ color: "var(--text-secondary)" }}>
        {value || "—"}
      </span>
    )}
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
    {children}
  </p>
);

const FaceThumb = ({ url, matched, onClick }) => {
  if (!url)
    return (
      <div className="flex flex-col">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          —
        </span>
        <span className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          No image
        </span>
      </div>
    );

  const label = matched == null ? "Processed" : matched ? "Matched ✓" : "Mismatch ✗";
  const borderColor = matched == null ? "var(--border-base)" : matched ? "var(--status-active-border)" : "#ef4444";
  const labelColor = matched == null ? "var(--text-secondary)" : matched ? "var(--status-active-border)" : "#ef4444";

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg overflow-hidden border transition-transform hover:scale-[1.04] flex-shrink-0"
        style={{ borderColor }}
        title="Preview face image"
      >
        <img src={url} alt="face" className="w-12 h-12 object-cover" />
      </button>
      <div className="flex flex-col">
        <span className="text-xs font-bold" style={{ color: labelColor }}>
          {label}
        </span>
        <span className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {matched == null ? "—" : matched ? "Verified" : "No match"}
        </span>
      </div>
    </div>
  );
};

const LocationDot = ({ isInGeofence }) => (
  <span
    className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
    style={{ background: isInGeofence ? "var(--status-active-border)" : "#ef4444" }}
    title={isInGeofence ? "Inside geofence" : "Outside geofence"}
  />
);

// ─────────────────────────────────────────────────────────────
// Event form helpers
// ─────────────────────────────────────────────────────────────

const emptyEventForm = () => ({
  title: "",
  description: "",
  date: "",
  time: "",
  venue_name: "",
  venue_maps_url: "",
  required_photos: 3,
  activity_list: [],
  _activity_input: "",
  thumbnail_url: null,
  _thumbnail_file: null,
  _thumbnail_preview: "",
  _thumbnail_uploading: false,
});

const eventToForm = (ev) => ({
  title: ev.title || "",
  description: ev.description || "",
  date: ev.event_date || ev.date || "",
  time: ev.start_time || ev.event_time || ev.time || "",
  venue_name: ev.venue_name || "",
  venue_maps_url: ev.venue_maps_url || "",
  required_photos: ev.required_photos ?? 3,
  activity_list: Array.isArray(ev.activity_list) ? ev.activity_list : [],
  _activity_input: "",
  thumbnail_url: ev.thumbnail_url || null,
  _thumbnail_file: null,
  _thumbnail_preview: ev.thumbnail_url || "",
  _thumbnail_uploading: false,
});

// ─────────────────────────────────────────────────────────────
// Shared style objects
// ─────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border-base)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const textareaStyle = { ...inputStyle, lineHeight: "1.6", resize: "none" };
const addBtnStyle = {
  flexShrink: 0,
  padding: "0 18px",
  height: "42px",
  borderRadius: "8px",
  border: "1px solid var(--border-base)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};
const uploadLabelStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  padding: "32px 20px",
  borderRadius: "10px",
  border: "2px dashed var(--border-base)",
  background: "var(--bg-card)",
  cursor: "pointer",
};

// ─────────────────────────────────────────────────────────────
// Form sub-components
// ─────────────────────────────────────────────────────────────

const SectionHead = ({ num, title, hint = "", sub = "" }) => (
  <div style={{ marginBottom: sub ? "4px" : "16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--brand-600, #2563eb)",
          color: "#fff",
          fontSize: "11px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
        {title}
        {hint && (
          <span style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", marginLeft: "8px" }}>
            ({hint})
          </span>
        )}
      </span>
    </div>
    {sub && (
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginBottom: "16px",
          marginLeft: "28px",
          marginTop: "4px",
        }}
      >
        {sub}
      </p>
    )}
  </div>
);

const FieldWrap = ({ label, required = false, hint = "", children }) => (
  <div>
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: "500",
        color: "var(--text-secondary)",
        marginBottom: "6px",
      }}
    >
      {label}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
      {hint && (
        <span style={{ fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", marginLeft: "6px" }}>
          ({hint})
        </span>
      )}
    </label>
    {children}
  </div>
);

const Divider = () => <div style={{ height: "1px", background: "var(--border-base)" }} />;

// ─────────────────────────────────────────────────────────────
// EventFormFields — shared between create & edit modals
// ─────────────────────────────────────────────────────────────

const EventFormFields = ({
  form,
  setForm,
  onThumbnailSelect,
  onRemoveThumbnail,
  activityTypes,
  loadingActivityTypes,
  activityTypesError,
}) => {
  const addTag = (tag) => {
    const t = String(tag || "").trim();
    if (!t || form.activity_list.includes(t)) return;
    setForm((p) => ({ ...p, activity_list: [...p.activity_list, t], _activity_input: "" }));
  };
  const removeTag = (tag) => setForm((p) => ({ ...p, activity_list: p.activity_list.filter((a) => a !== tag) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <section>
        <SectionHead num={1} title="Basic Information" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <FieldWrap label="Activity Title" required>
            <Input
              placeholder="e.g. Annual Tree Plantation Drive"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </FieldWrap>
          <FieldWrap label="Description" hint="optional">
            <textarea
              rows={3}
              placeholder="Describe the event purpose, goals…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={textareaStyle}
            />
          </FieldWrap>
        </div>
      </section>

      <Divider />

      <section>
        <SectionHead num={2} title="Date & Time" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "16px" }}>
          <FieldWrap label="Date" required>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              style={inputStyle}
            />
          </FieldWrap>
          <FieldWrap label="Time">
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              style={inputStyle}
            />
          </FieldWrap>
        </div>
      </section>

      <Divider />

      <section>
        <SectionHead num={3} title="Location" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <FieldWrap label="Venue Name">
            <Input
              placeholder="e.g. BNMIT Campus Grounds"
              value={form.venue_name}
              onChange={(e) => setForm((p) => ({ ...p, venue_name: e.target.value }))}
            />
          </FieldWrap>
          <FieldWrap label="Google Maps URL" hint="optional">
            <Input
              placeholder="https://maps.google.com/…"
              value={form.venue_maps_url}
              onChange={(e) => setForm((p) => ({ ...p, venue_maps_url: e.target.value }))}
            />
          </FieldWrap>
        </div>
      </section>

      <Divider />

      <section>
        <SectionHead num={4} title="List of Activities" sub="Select from presets (DB) or add custom activities" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <FieldWrap label="Add from preset list (from backend)">
            <select
              onChange={(e) => {
                if (e.target.value) addTag(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              style={inputStyle}
              disabled={loadingActivityTypes}
            >
              <option value="" disabled>
                {loadingActivityTypes ? "Loading activity types…" : "Choose an activity type…"}
              </option>
              {(activityTypes || []).map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            {!!activityTypesError && (
              <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
                {activityTypesError}
              </p>
            )}
          </FieldWrap>

          <FieldWrap label="Or add a custom activity">
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="Type activity name and press Enter…"
                  value={form._activity_input}
                  onChange={(e) => setForm((p) => ({ ...p, _activity_input: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(form._activity_input);
                    }
                  }}
                />
              </div>
              <button type="button" onClick={() => addTag(form._activity_input)} style={addBtnStyle}>
                + Add
              </button>
            </div>
          </FieldWrap>

          {form.activity_list.length > 0 && (
            <div
              style={{
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid var(--border-base)",
                background: "var(--bg-card)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Selected ({form.activity_list.length})
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.activity_list.map((a) => (
                  <ActivityTag key={a} label={a} onRemove={() => removeTag(a)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Divider />

      <section>
        <SectionHead num={5} title="Photo Requirements" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border-base)",
            background: "var(--bg-card)",
          }}
        >
          <div>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", margin: 0 }}>
              Required Photos per Submission
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
              Students must upload between 3 and 5 photos
            </p>
          </div>
          <select
            value={form.required_photos}
            onChange={(e) => setForm((p) => ({ ...p, required_photos: Number(e.target.value) }))}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-base)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "14px",
              fontWeight: "600",
              outline: "none",
              cursor: "pointer",
              minWidth: "70px",
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </section>

      <Divider />

      <section>
        <SectionHead num={6} title="Event Thumbnail" hint="optional" sub="Upload a cover image for this event (stored in MinIO)" />
        {!form._thumbnail_preview ? (
          <label style={uploadLabelStyle}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={onThumbnailSelect} />
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--brand-600, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.85,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)", margin: 0 }}>
                Click to upload thumbnail
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                PNG, JPG, WEBP — max 5 MB
              </p>
            </div>
          </label>
        ) : (
          <div
            style={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid var(--border-base)",
              background: "var(--bg-card)",
            }}
          >
            <img
              src={form._thumbnail_preview}
              alt="Thumbnail preview"
              style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
            />
            {form._thumbnail_uploading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p style={{ color: "#fff", fontSize: "12px", margin: 0 }}>Uploading…</p>
              </div>
            )}
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: form.thumbnail_url ? "#22c55e" : "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                {form.thumbnail_url ? "Uploaded successfully" : form._thumbnail_uploading ? "Uploading to storage…" : "Ready"}
              </div>
              <button
                type="button"
                onClick={onRemoveThumbnail}
                disabled={form._thumbnail_uploading}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-base)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                  opacity: form._thumbnail_uploading ? 0.4 : 1,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </section>

      <div style={{ height: "8px" }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const ActivitiesPage = () => {
  const { authFetch } = useAuth();

  // Top "Students-like" tab (right pills)
  const [activeTab, setActiveTab] = useState("events"); // "events" | "sessions"

  // ══════════════════════════════════════════════════════════
  // Activity Types (✅ from backend; replaces hardcoded ACTIVITY_OPTIONS)
  // ══════════════════════════════════════════════════════════

  const [activityTypes, setActivityTypes] = useState([]);
  const [loadingActivityTypes, setLoadingActivityTypes] = useState(false);
  const [activityTypesError, setActivityTypesError] = useState("");

  // ══════════════════════════════════════════════════════════
  // EVENTS TAB STATE
  // ══════════════════════════════════════════════════════════

  const [evSearch, setEvSearch] = useState("");
  const [evStatusFilter, setEvStatusFilter] = useState("All");
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Create event
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState(emptyEventForm());

  // Edit event
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [editForm, setEditForm] = useState(emptyEventForm());
  const [editTargetId, setEditTargetId] = useState(null);

  // Delete event
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Photos modal (events)
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activePhotos, setActivePhotos] = useState([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);

  // Student cache
  const [studentById, setStudentById] = useState({});

  // ══════════════════════════════════════════════════════════
  // SESSIONS TAB STATE
  // ══════════════════════════════════════════════════════════

  const [sesSearch, setSesSearch] = useState("");
  const [sesStatusFilter, setSesStatusFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Session detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);

  // Image preview modal (shared)
  const [imgPreviewOpen, setImgPreviewOpen] = useState(false);
  const [imgPreviewUrl, setImgPreviewUrl] = useState("");
  const [imgPreviewTitle, setImgPreviewTitle] = useState("");

  // Shared error
  const [error, setError] = useState("");

  // End event
  const [endingEvent, setEndingEvent] = useState(false);
  const [generatingCertificates, setGeneratingCertificates] = useState(false);
  const generateCertificatesForEvent = async () => {
  if (!selectedEvent) return;

  const ok = confirm(
    `Generate certificates for "${selectedEvent.title}"?\n\nOnly APPROVED students will receive certificates.`
  );
  if (!ok) return;

  setGeneratingCertificates(true);

  try {
    const res = await authFetch(
      `/admin/events/${selectedEvent.id}/certificates/regenerate`,
      { method: "POST" }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || "Certificate generation failed");

    alert("Certificates generated successfully.");
  } catch (e) {
    alert(e?.message || "Certificate generation failed");
  } finally {
    setGeneratingCertificates(false);
  }
};

  // ─────────────────────────────────────────────────────────
  // Auth helpers
  // ─────────────────────────────────────────────────────────

  const authJson = async (url, { method = "GET", body, headers = {}, ...rest } = {}) =>
    authFetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });

  const openImagePreview = (url, title = "Image Preview") => {
    const u = safeStr(url).trim();
    if (!u) return;
    setImgPreviewUrl(u);
    setImgPreviewTitle(title);
    setImgPreviewOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Activity Types API
  // ─────────────────────────────────────────────────────────

  const fetchActivityTypes = async () => {
    setLoadingActivityTypes(true);
    setActivityTypesError("");
    try {
      // If your backend route is "/api/activity-types", and authFetch already prefixes "/api",
      // keep it as "/activity-types". (Same pattern as the rest of your file.)
      const res = await authFetch("/activity-types?active_only=true&approved_only=true", { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.detail || "Failed to load activity types");

      setActivityTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      setActivityTypes([]);
      setActivityTypesError(e?.message || "Failed to load activity types");
    } finally {
      setLoadingActivityTypes(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Thumbnail helpers factory
  // ─────────────────────────────────────────────────────────

  const makeThumbnailHandlers = (setForm) => ({
    handleThumbnailSelect: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return alert("Please select an image file");
      if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5 MB");

      const preview = URL.createObjectURL(file);
      setForm((p) => ({
        ...p,
        _thumbnail_file: file,
        _thumbnail_preview: preview,
        thumbnail_url: null,
        _thumbnail_uploading: true,
      }));

      try {
        const res = await authJson("/admin/events/thumbnail-upload-url", {
          method: "POST",
          body: { filename: file.name, content_type: file.type },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.upload_url) throw new Error(json?.detail || "Could not get upload URL");

        const putRes = await fetch(json.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        setForm((p) => ({ ...p, thumbnail_url: json.public_url, _thumbnail_uploading: false }));
      } catch (err) {
        alert(err?.message || "Thumbnail upload failed");
        setForm((p) => ({
          ...p,
          _thumbnail_uploading: false,
          _thumbnail_file: null,
          _thumbnail_preview: "",
          thumbnail_url: null,
        }));
      }
    },
    removeThumbnail: () => {
      setForm((p) => {
        if (p._thumbnail_preview?.startsWith("blob:")) URL.revokeObjectURL(p._thumbnail_preview);
        return { ...p, _thumbnail_file: null, _thumbnail_preview: "", thumbnail_url: null, _thumbnail_uploading: false };
      });
    },
  });

  const { handleThumbnailSelect: newThumbSelect, removeThumbnail: newThumbRemove } = makeThumbnailHandlers(setNewEvent);
  const { handleThumbnailSelect: editThumbSelect, removeThumbnail: editThumbRemove } = makeThumbnailHandlers(setEditForm);

  // ══════════════════════════════════════════════════════════
  // EVENTS API
  // ══════════════════════════════════════════════════════════

  const fetchEvents = async () => {
    setLoadingEvents(true);
    setError("");
    try {
      const res = await authFetch("/admin/events", { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.detail || "Failed to load events");

      const arr = Array.isArray(data) ? data : [];
      setEvents(arr);
      setSelectedEventId((prev) => (prev ? prev : arr.length ? String(arr[0].id) : ""));
    } catch (e) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const hydrateStudents = async (subs) => {
    const ids = [...new Set((subs || []).map((s) => Number(s?.student_id)).filter((x) => Number.isFinite(x) && x > 0))];
    const missing = ids.filter((id) => !studentById[id]);
    if (!missing.length) return;

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
      }
    } catch {
      /* silent */
    }
  };

  const fetchSubmissions = async (eventId) => {
    if (!eventId) return;
    setLoadingSubs(true);
    setError("");
    try {
      const res = await authFetch(`/admin/events/${eventId}/submissions`, { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.detail || "Failed to load submissions");

      const arr = Array.isArray(data) ? data : [];
      setSubmissions(arr);
      await hydrateStudents(arr);
    } catch (e) {
      setError(e?.message || "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const createEventApi = async () => {
    if (!newEvent.title.trim()) return alert("Title is required");
    if (!newEvent.date) return alert("Date is required");

    setCreatingEvent(true);
    try {
      const payload = {
        title: newEvent.title.trim(),
        description: newEvent.description?.trim() || null,
        event_date: newEvent.date || null,
        event_time: newEvent.time || null,
        date: newEvent.date || null,
        time: newEvent.time || null,
        venue_name: newEvent.venue_name?.trim() || null,
        venue_maps_url: newEvent.venue_maps_url?.trim() || null,
        required_photos: Number(newEvent.required_photos),
        activity_list: newEvent.activity_list,
        thumbnail_url: newEvent.thumbnail_url || null,
      };

      const res = await authJson("/admin/events", { method: "POST", body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to create event");

      await fetchEvents();
      if (data?.id) setSelectedEventId(String(data.id));

      setNewEvent(emptyEventForm());
      setAddEventOpen(false);
    } catch (e) {
      alert(e?.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const openEditEvent = (ev) => {
    fetchActivityTypes(); // ✅ keep presets fresh
    setEditTargetId(ev.id);
    setEditForm(eventToForm(ev));
    setEditEventOpen(true);
  };

  const saveEditEvent = async () => {
    if (!editForm.title.trim()) return alert("Title is required");
    if (!editForm.date) return alert("Date is required");

    setEditingEvent(true);
    try {
      const payload = {
  title: editForm.title.trim(),
  description: editForm.description?.trim() || null,

  event_date: editForm.date || null,
  event_time: editForm.time || null,
  date: editForm.date || null,
  time: editForm.time || null,

  venue_name: editForm.venue_name?.trim() || null,

  // ✅ send BOTH for compatibility
  maps_url: editForm.venue_maps_url?.trim() || null,
  venue_maps_url: editForm.venue_maps_url?.trim() || null,

  required_photos: Number(editForm.required_photos),
  activity_list: editForm.activity_list,
  thumbnail_url: editForm.thumbnail_url || null,
};

      const res = await authJson(`/admin/events/${editTargetId}`, { method: "PUT", body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to update event");

      setEvents((prev) => prev.map((e) => (e.id === editTargetId ? { ...e, ...data } : e)));
      setEditEventOpen(false);
      setEditTargetId(null);
    } catch (e) {
      alert(e?.message || "Failed to update event");
    } finally {
      setEditingEvent(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeletingEventId(eventToDelete.id);

    try {
      const res = await authFetch(`/admin/events/${eventToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || "Delete failed");
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));

      if (String(eventToDelete.id) === selectedEventId) {
        const rem = events.filter((e) => e.id !== eventToDelete.id);
        setSelectedEventId(rem.length ? String(rem[0].id) : "");
        setSubmissions([]);
      }

      setConfirmDeleteOpen(false);
      setEventToDelete(null);
    } catch (e) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeletingEventId(null);
    }
  };

  const onEventApprove = async (submissionId) => {
    if (!confirm("Approve this submission?")) return;
    try {
      const res = await authFetch(`/admin/submissions/${submissionId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Approve failed");
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, ...data } : s)));
    } catch (e) {
      alert(e?.message || "Approve failed");
    }
  };

  const onEventReject = async (submissionId) => {
    const reason = prompt("Reject reason (required):");
    if (!reason) return;
    try {
      const res = await authJson(`/admin/submissions/${submissionId}/reject`, { method: "POST", body: { reason } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Reject failed");
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, ...data } : s)));
    } catch (e) {
      alert(e?.message || "Reject failed");
    }
  };

  const selectedEvent = events.find((e) => String(e.id) === selectedEventId);

  const endSelectedEvent = async () => {
    if (!selectedEvent) return;

    const ok = confirm(
      `End "${selectedEvent.title}" now?\n\nStudents will NOT be able to upload photos or submit after you end it.`
    );
    if (!ok) return;

    setEndingEvent(true);
    try {
      const res = await authFetch(`/admin/events/${selectedEvent.id}/end`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to end event");

      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? { ...e, ...data } : e)));

      await fetchEvents();
      if (selectedEventId) await fetchSubmissions(selectedEventId);

      alert("Event ended successfully.");
    } catch (e) {
      alert(e?.message || "Failed to end event");
    } finally {
      setEndingEvent(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchActivityTypes(); // ✅ load presets once
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchSubmissions(selectedEventId);
  }, [selectedEventId]);

  // ══════════════════════════════════════════════════════════
  // SESSIONS API
  // ══════════════════════════════════════════════════════════

const fetchSessions = async () => {
  setLoadingSessions(true);
  setError("");

  try {
    const params = new URLSearchParams();

    // ✅ Queue => omit status
    // ✅ All => status=ALL
    // ✅ Others => status=<VALUE>
    if (sesStatusFilter === "All") params.set("status", "ALL");
    else if (sesStatusFilter !== "Queue") params.set("status", sesStatusFilter);

    if (sesSearch.trim()) params.set("q", sesSearch.trim());

    const url = `/admin/sessions${params.toString() ? `?${params}` : ""}`;
    const res = await authFetch(url, { method: "GET" });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.detail || "Failed to load sessions");

    // ✅ accept multiple backend shapes
    const arr =
      Array.isArray(data) ? data :
      Array.isArray(data?.items) ? data.items :
      Array.isArray(data?.rows) ? data.rows :
      Array.isArray(data?.results) ? data.results :
      Array.isArray(data?.sessions) ? data.sessions :
      [];

    // TEMP DEBUG (remove later)
    console.log("SESSIONS API:", url, data);
    console.log("SESSIONS ARRAY LEN:", arr.length);

    setSessions(arr);
  } catch (e) {
    setError(e?.message || "Failed to load sessions");
    setSessions([]);
  } finally {
    setLoadingSessions(false);
  }
};

  const openSessionDetail = async (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await authFetch(`/admin/sessions/${sessionId}`, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to load session detail");
      setActiveDetail(data);
    } catch (e) {
      setError(e?.message || "Failed to load session detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const onSessionApprove = async (sessionId) => {
    if (!confirm("Approve this submission?")) return;
    try {
      const res = await authFetch(`/admin/sessions/${sessionId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Approve failed");

      const newStatus = data?.status ?? "APPROVED";
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)));
      setActiveDetail((p) => (p?.id === sessionId ? { ...p, status: newStatus } : p));
    } catch (e) {
      alert(e?.message || "Approve failed");
    }
  };

  const onSessionReject = async (sessionId) => {
    const reason = prompt("Reject reason (required):");
    if (!reason?.trim()) return;

    try {
      const res = await authFetch(`/admin/sessions/${sessionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Reject failed");

      const newStatus = data?.status ?? "REJECTED";
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)));
      setActiveDetail((p) => (p?.id === sessionId ? { ...p, status: newStatus, flag_reason: reason } : p));
    } catch (e) {
      alert(e?.message || "Reject failed");
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesStatusFilter, activeTab]);

  // ══════════════════════════════════════════════════════════
  // DERIVED
  // ══════════════════════════════════════════════════════════

  const evCounts = useMemo(
    () => ({
      total: submissions.length,
      approved: submissions.filter((s) => s.status === "approved").length,
      pending: submissions.filter((s) => s.status === "submitted").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    }),
    [submissions]
  );

  const evFiltered = useMemo(() => {
    const q = evSearch.toLowerCase();
    return submissions.filter((s) => {
      const sid = Number(s?.student_id);
      const st = Number.isFinite(sid) ? studentById[sid] : null;
      const merged = { ...s, student: st };

      const name = firstNonEmpty(getStudentName(merged), st?.name);
      const usn = firstNonEmpty(getStudentUSN(merged), st?.usn);
      const college = firstNonEmpty(getCollegeName(merged), st?.college);

      const matchSearch = [
        safeStr(s.id),
        safeStr(s.student_id),
        safeStr(name),
        safeStr(usn),
        safeStr(college),
        safeStr(s.status),
      ].some((v) => v.toLowerCase().includes(q));

      const matchStatus = evStatusFilter === "All" || s.status === evStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [submissions, evSearch, evStatusFilter, studentById]);

  const sesCounts = useMemo(() => {
    const norm = (x) => String(x || "").toUpperCase();
    return {
      total: sessions.length,
      submitted: sessions.filter((s) => norm(s.status) === "SUBMITTED").length,
      flagged: sessions.filter((s) => norm(s.status) === "FLAGGED").length,
      approved: sessions.filter((s) => norm(s.status) === "APPROVED").length,
      rejected: sessions.filter((s) => norm(s.status) === "REJECTED").length,
    };
  }, [sessions]);

  const sesFiltered = useMemo(() => {
    const q = sesSearch.toLowerCase().trim();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [
        safeStr(s.id),
        safeStr(s.student_id),
        safeStr(s.student_name),
        safeStr(s.usn),
        safeStr(s.college),
        safeStr(s.activity_name),
        safeStr(s.status),
        safeStr(s.latest_face_reason),
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [sessions, sesSearch]);

  // ─────────────────────────────────────────────────────────
  // Students-like header counts
  // ─────────────────────────────────────────────────────────

  const headerMeta = useMemo(() => {
    if (activeTab === "events") {
      return `${events.length} events · ${submissions.length} submissions`;
    }
    return `${sessions.length} sessions`;
  }, [activeTab, events.length, submissions.length, sessions.length]);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      {/* ── Header (Students-style) ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Activities
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {headerMeta}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TopPill label="Event Submissions" active={activeTab === "events"} onClick={() => setActiveTab("events")} />
          <TopPill label="Activity Sessions" active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} />
        </div>
      </div>

      {/* ── Error ── */}
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

      {/* ════════════════════════════════════════════════════
          TOP BAR (Search + Refresh + Actions) - Students-style
      ════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap">
        {activeTab === "events" ? (
          <>
            <Input
              icon="search"
              placeholder="Search by name / USN / college / status…"
              value={evSearch}
              onChange={(e) => setEvSearch(e.target.value)}
              containerClassName="flex-1 min-w-[260px]"
            />

            <button
              onClick={() => selectedEventId && fetchSubmissions(selectedEventId)}
              className="px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2"
              style={{ borderColor: "var(--border-base)", color: "var(--text-muted)", background: "var(--bg-card)" }}
            >
              <Icon name="refresh-cw" size={16} /> Refresh
            </button>

            <button
              onClick={() => {
                fetchActivityTypes();
                setAddEventOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-90"
              style={{
                background: "var(--brand-600, #2563eb)",
                borderColor: "var(--brand-600, #2563eb)",
                color: "#fff",
              }}
            >
              + Add Event
            </button>
          </>
        ) : (
          <>
            <Input
              icon="search"
              placeholder="Search by name / USN / activity / status…"
              value={sesSearch}
              onChange={(e) => setSesSearch(e.target.value)}
              containerClassName="flex-1 min-w-[260px]"
            />
            <button
              onClick={fetchSessions}
              className="px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2"
              style={{ borderColor: "var(--border-base)", color: "var(--text-muted)", background: "var(--bg-card)" }}
            >
              <Icon name="refresh-cw" size={16} /> Refresh
            </button>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          EVENTS TAB
      ════════════════════════════════════════════════════ */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Event select + actions row */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-base)", color: "var(--text-primary)" }}
              disabled={loadingEvents || events.length === 0}
            >
              {events.length === 0 ? (
                <option value="">{loadingEvents ? "Loading…" : "No events"}</option>
              ) : (
                events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.title}
                  </option>
                ))
              )}
            </select>

            {selectedEvent && (
  <>
    <button
      onClick={() => openEditEvent(selectedEvent)}
      className="px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2"
      style={{ borderColor: "var(--border-base)", color: "var(--text-muted)", background: "var(--bg-card)" }}
    >
      <Icon name="edit-2" size={15} /> Edit
    </button>

    <button
      onClick={endSelectedEvent}
      disabled={endingEvent}
      className="px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2"
      style={{
        borderColor: "var(--border-base)",
        color: "var(--text-muted)",
        background: "var(--bg-card)",
        opacity: endingEvent ? 0.6 : 1,
      }}
    >
      <Icon name="stop-circle" size={15} />
      {endingEvent ? "Ending…" : "End"}
    </button>

    {/* ✅ NEW: Generate Certificates */}
    <button
      onClick={generateCertificatesForEvent}
      disabled={generatingCertificates}
      className="px-3 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2"
      style={{
        borderColor: "var(--status-active-border)",
        color: "var(--status-active-border)",
        background: "var(--bg-card)",
        opacity: generatingCertificates ? 0.6 : 1,
      }}
    >
      <Icon name="award" size={15} />
      {generatingCertificates ? "Generating…" : "Generate Certificates"}
    </button>

    <button
      onClick={() => {
        setEventToDelete(selectedEvent);
        setConfirmDeleteOpen(true);
      }}
      disabled={deletingEventId === selectedEvent.id}
      className="px-3 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2"
      style={{
        borderColor: "#ef4444",
        color: "#ef4444",
        background: "var(--bg-card)",
        opacity: deletingEventId === selectedEvent.id ? 0.5 : 1,
      }}
    >
      <Icon name="trash-2" size={15} />
      {deletingEventId === selectedEvent.id ? "Deleting…" : "Delete"}
    </button>
  </>
)}
          </div>

          {/* Filters like small pills */}
          <div className="flex gap-2 flex-wrap">
            {EVENT_STATUSES.map((s) => (
              <PillBtn
                key={s}
                label={s === "All" ? "All" : eventStatusToUi(s)}
                active={evStatusFilter === s}
                onClick={() => setEvStatusFilter(s)}
              />
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniCard label="Total" value={evCounts.total} borderVar="--border-base" />
            <MiniCard label="Approved" value={evCounts.approved} borderVar="--status-active-border" />
            <MiniCard label="Pending" value={evCounts.pending} borderVar="--status-pending-border" />
            <MiniCard label="Rejected" value={evCounts.rejected} borderVar="--status-review-border" />
          </div>

          {/* Table */}
          <Card>
            {loadingSubs ? (
              <div className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading submissions…
              </div>
            ) : evFiltered.length === 0 ? (
              <EmptyState icon="activity" title="No submissions found" description="Adjust filters or select another event." />
            ) : (
              <Table headers={["Student", "Event", "Submitted", "Status", "Actions"]}>
                {evFiltered.map((s) => {
                  const sid = Number(s?.student_id);
                  const st = Number.isFinite(sid) ? studentById[sid] : null;
                  const merged = { ...s, student: st };

                  const name = firstNonEmpty(getStudentName(merged), st?.name);
                  const usn = firstNonEmpty(getStudentUSN(merged), st?.usn);
                  const college = firstNonEmpty(getCollegeName(merged), st?.college);

                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {name || `Student #${s?.student_id}`}
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            USN: {usn || "—"}
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {college || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        Event #{s.event_id}
                      </td>

                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.submitted_at ? formatDate(s.submitted_at) : "—"}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={eventStatusToUi(s.status)} />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => {
                              setActivePhotos(extractPhotoUrls(s));
                              setActiveSubmissionId(s.id);
                              setPhotoModalOpen(true);
                            }}
                            title="View photos"
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          {s.status === "submitted" && (
                            <>
                              <button
                                className="p-1.5 rounded-lg"
                                style={{ color: "var(--status-active-border)" }}
                                onClick={() => onEventApprove(s.id)}
                                title="Approve"
                              >
                                <Icon name="check" size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg"
                                style={{ color: "#ef4444" }}
                                onClick={() => onEventReject(s.id)}
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          SESSIONS TAB
      ════════════════════════════════════════════════════ */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {SESSION_STATUSES.map((s) => (
              <PillBtn key={s} label={s === "Queue" ? "Queue" : s} active={sesStatusFilter === s} onClick={() => setSesStatusFilter(s)} />
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MiniCard label="Total" value={sesCounts.total} borderVar="--border-base" />
            <MiniCard label="Submitted" value={sesCounts.submitted} borderVar="--status-pending-border" />
            <MiniCard label="Flagged" value={sesCounts.flagged} borderVar="--status-review-border" />
            <MiniCard label="Approved" value={sesCounts.approved} borderVar="--status-active-border" />
            <MiniCard label="Rejected" value={sesCounts.rejected} borderVar="--status-review-border" />
          </div>

          {/* Table */}
          <Card>
            {loadingSessions ? (
              <div className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading sessions…
              </div>
            ) : sesFiltered.length === 0 ? (
              <EmptyState icon="activity" title="No sessions found" description="Adjust filters or search." />
            ) : (
              <Table headers={["Student", "Activity", "Timing", "Location", "Face", "Points", "Status", "Actions"]}>
                {sesFiltered.map((s) => {
                  const mapsUrl =s.activity_type?.maps_url || googleMapsUrl(s.activity_type?.target_lat, s.activity_type?.target_lng);
                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {s.student_name || `Student #${s.student_id}`}
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            USN: {s.usn || "—"}
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {s.college || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                            {s.activity_name || `Activity #${s.activity_type_id}`}
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            #{s.id} · {s.photos_count ?? 0} photos
                          </span>
                        </div>
                      </td>

                      {/* Timing */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col text-xs" style={{ color: "var(--text-muted)" }}>
                          <span>
                            <span className="font-semibold" style={{ color: "var(--status-active-border)" }}>
                              IN
                            </span>{" "}
                            {fmtTime(s.in_time)}
                          </span>
                          <span>
                            <span className="font-semibold" style={{ color: "#ef4444" }}>
                              OUT
                            </span>{" "}
                            {fmtTime(s.out_time)}
                          </span>
                          <span className="mt-0.5">{fmtDuration(s.duration_hours)}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs underline"
                            style={{ color: "var(--brand-400)" }}
                          >
                            <Icon name="map-pin" size={12} />
                            View map
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            —
                          </span>
                        )}
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {s.photos_count ?? 0} GPS pts
                        </div>
                      </td>

                      {/* Face */}
                      <td className="px-4 py-3.5">
                        <FaceThumb
                          url={s.latest_face_processed_url}
                          matched={s.latest_face_matched}
                          onClick={() => openImagePreview(s.latest_face_processed_url, `Session #${s.id} · Face`)}
                        />
                        {s.latest_face_reason && (
                          <div
                            className="text-[11px] mt-1 max-w-[110px] truncate"
                            style={{ color: "var(--text-muted)" }}
                            title={s.latest_face_reason}
                          >
                            {s.latest_face_reason}
                          </div>
                        )}
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-lg font-bold" style={{ color: "var(--brand-400)" }}>
                          {s.total_activity_points ?? 0}
                        </span>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          pts
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sessionBadgeStatus(s.status)} />
                        {s.flag_reason && (
                          <div
                            className="text-[11px] mt-1 max-w-[100px] truncate"
                            style={{ color: "var(--text-muted)" }}
                            title={s.flag_reason}
                          >
                            {s.flag_reason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => openSessionDetail(s.id)}
                            title="View details"
                          >
                            <Icon name="external-link" size={14} />
                          </button>
                          {["SUBMITTED", "FLAGGED"].includes(String(s.status || "").toUpperCase()) && (
                            <>
                              <button
                                className="p-1.5 rounded-lg"
                                style={{ color: "var(--status-active-border)" }}
                                onClick={() => onSessionApprove(s.id)}
                                title="Approve"
                              >
                                <Icon name="check" size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg"
                                style={{ color: "#ef4444" }}
                                onClick={() => onSessionReject(s.id)}
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════ */}

      {/* ── Event: Photos Modal ── */}
      <Modal open={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title={`Submission #${activeSubmissionId} Photos`}>
        {activePhotos.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No photos attached.
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

      {/* ── Event: Confirm Delete Modal ── */}
      <Modal
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setEventToDelete(null);
        }}
        title="Delete Event"
      >
        <div style={{ padding: "8px 0 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
            Delete "{eventToDelete?.title}"?
          </p>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "28px" }}>
            This will permanently delete the event and all associated submissions.
            <br />
            <strong>This action cannot be undone.</strong>
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                setConfirmDeleteOpen(false);
                setEventToDelete(null);
              }}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid var(--border-base)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteEvent}
              disabled={!!deletingEventId}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: deletingEventId ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: deletingEventId ? 0.6 : 1,
              }}
            >
              {deletingEventId ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Event: Create Modal ── */}
      <Modal open={addEventOpen} onClose={() => setAddEventOpen(false)} title="Add New Event">
        <div style={{ display: "flex", flexDirection: "column", height: "72vh" }}>
          <div className="overflow-y-auto flex-1" style={{ padding: "4px 24px 24px 24px" }}>
            <EventFormFields
              form={newEvent}
              setForm={setNewEvent}
              onThumbnailSelect={newThumbSelect}
              onRemoveThumbnail={newThumbRemove}
              activityTypes={activityTypes}
              loadingActivityTypes={loadingActivityTypes}
              activityTypesError={activityTypesError}
            />
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: "16px 24px",
              borderTop: "1px solid var(--border-base)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              background: "var(--bg-card, #fff)",
            }}
          >
            <button
              onClick={() => {
                setAddEventOpen(false);
                setNewEvent(emptyEventForm());
              }}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "1px solid var(--border-base)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={createEventApi}
              disabled={creatingEvent}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background: creatingEvent ? "#93c5fd" : "var(--brand-600, #2563eb)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: creatingEvent ? "not-allowed" : "pointer",
              }}
            >
              {creatingEvent ? "Creating…" : "Create Event"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Event: Edit Modal ── */}
      <Modal
        open={editEventOpen}
        onClose={() => {
          setEditEventOpen(false);
          setEditTargetId(null);
        }}
        title="Edit Event"
      >
        <div style={{ display: "flex", flexDirection: "column", height: "72vh" }}>
          <div className="overflow-y-auto flex-1" style={{ padding: "4px 24px 24px 24px" }}>
            <EventFormFields
              form={editForm}
              setForm={setEditForm}
              onThumbnailSelect={editThumbSelect}
              onRemoveThumbnail={editThumbRemove}
              activityTypes={activityTypes}
              loadingActivityTypes={loadingActivityTypes}
              activityTypesError={activityTypesError}
            />
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: "16px 24px",
              borderTop: "1px solid var(--border-base)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              background: "var(--bg-card, #fff)",
            }}
          >
            <button
              onClick={() => {
                setEditEventOpen(false);
                setEditTargetId(null);
              }}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "1px solid var(--border-base)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveEditEvent}
              disabled={editingEvent}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background: editingEvent ? "#93c5fd" : "var(--brand-600, #2563eb)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: editingEvent ? "not-allowed" : "pointer",
              }}
            >
              {editingEvent ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Session: Detail Modal ── */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveSessionId(null);
          setActiveDetail(null);
        }}
        title={activeSessionId ? `Session #${activeSessionId} — Detail` : "Session Detail"}
      >
        {detailLoading ? (
          <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </div>
        ) : !activeDetail ? (
          <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No detail found.
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {/* Student + Status */}
            <section className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {activeDetail.student_name || `Student #${activeDetail.student_id}`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    USN: {activeDetail.usn || "—"} · {activeDetail.college || "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Face enrolled: {activeDetail.face_enrolled ? "Yes ✓" : "No ✗"}
                  </p>
                </div>
                <StatusBadge status={sessionBadgeStatus(activeDetail.status)} />
              </div>

              {["SUBMITTED", "FLAGGED"].includes(String(activeDetail.status || "").toUpperCase()) && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onSessionApprove(activeDetail.id)}
                    className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                    style={{ borderColor: "var(--status-active-border)", color: "var(--status-active-border)" }}
                  >
                    <Icon name="check" size={13} /> Approve
                  </button>
                  <button
                    onClick={() => onSessionReject(activeDetail.id)}
                    className="px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                    style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  >
                    <Icon name="x" size={13} /> Reject
                  </button>
                </div>
              )}
            </section>

            {/* Timing */}
            <section className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
              <SectionLabel>Timing</SectionLabel>
              <InfoRow
                label="IN time (first photo)"
                value={activeDetail.in_time ? `${formatDate(activeDetail.in_time)}  ${fmtTime(activeDetail.in_time)}` : "—"}
              />
              <InfoRow
                label="OUT time (last photo)"
                value={activeDetail.out_time ? `${formatDate(activeDetail.out_time)}  ${fmtTime(activeDetail.out_time)}` : "—"}
              />
              <InfoRow label="Duration" value={fmtDuration(activeDetail.duration_hours)} />
              <InfoRow label="Submitted at" value={activeDetail.submitted_at ? formatDate(activeDetail.submitted_at) : "—"} />
              <InfoRow label="Expires at" value={activeDetail.expires_at ? formatDate(activeDetail.expires_at) : "—"} />
            </section>

            {/* Location Trail */}
            {Array.isArray(activeDetail.location_trail) && activeDetail.location_trail.length > 0 && (
              <section className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
                <SectionLabel>Location Trail ({activeDetail.location_trail.length} pts)</SectionLabel>

                <div className="space-y-2">
                  {activeDetail.location_trail.map((pt, idx) => {
                    const mapUrl = googleMapsUrl(pt.lat, pt.lng);
                    return (
                      <div key={idx} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <LocationDot isInGeofence={pt.is_in_geofence} />
                        <div className="flex-1">
                          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                            Photo {pt.seq_no}
                          </span>
                          {" · "}
                          {fmtTime(pt.captured_at)}
                          {pt.distance_m != null && (
                            <span className={pt.is_in_geofence ? "" : "text-red-400"}>
                              {" · "}
                              {Math.round(pt.distance_m)}m
                            </span>
                          )}
                        </div>
                        {mapUrl && (
                          <a href={mapUrl} target="_blank" rel="noreferrer" style={{ color: "var(--brand-400)" }}>
                            <Icon name="external-link" size={11} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Face Verification */}
            <section className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-base)" }}>
              <SectionLabel>Face Verification</SectionLabel>
              {!activeDetail.latest_face_check ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No face check available.
                </p>
              ) : (
                <>
                  <InfoRow label="Matched" value={activeDetail.latest_face_check.matched ? "Yes ✓" : "No ✗"} />
                  <InfoRow label="Cosine score" value={activeDetail.latest_face_check.cosine_score?.toFixed(4) ?? "—"} />
                  <InfoRow label="L2 score" value={activeDetail.latest_face_check.l2_score?.toFixed(4) ?? "—"} />
                  <InfoRow label="Total faces" value={activeDetail.latest_face_check.total_faces ?? "—"} />
                  <InfoRow label="Reason" value={activeDetail.latest_face_check.reason || "—"} />

                  {activeDetail.latest_face_processed_url && (
                    <button
                      type="button"
                      onClick={() => openImagePreview(activeDetail.latest_face_processed_url, `Session #${activeDetail.id} · Face`)}
                      className="mt-3 block w-full rounded-xl overflow-hidden border"
                      style={{
                        borderColor: activeDetail.latest_face_check.matched ? "var(--status-active-border)" : "#ef4444",
                      }}
                    >
                      <img src={activeDetail.latest_face_processed_url} alt="face-processed" className="w-full h-48 object-cover" />
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </Modal>

      {/* ── Shared: Image Preview Modal ── */}
      <Modal
        open={imgPreviewOpen}
        onClose={() => {
          setImgPreviewOpen(false);
          setImgPreviewUrl("");
        }}
        title={imgPreviewTitle}
      >
        {!imgPreviewUrl ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No image.
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
                <Icon name="external-link" size={14} /> Open in new tab
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivitiesPage;