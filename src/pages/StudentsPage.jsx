import React, { useEffect, useMemo, useState } from "react"
import { pct } from "@/utils/helpers"
import { useAuth } from "@/context/AuthContext"

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons — self-contained, no dependency
// ─────────────────────────────────────────────────────────────────────────────
const Ico = ({ size = 16, children, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {children}
  </svg>
)

const Icons = {
  Search:  () => <Ico><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>,
  Refresh: () => <Ico size={15}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Ico>,
  Eye:     () => <Ico size={14}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>,
  Edit:    () => <Ico size={14}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>,
  Close:   () => <Ico size={16}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>,
  Check:   () => <Ico size={14}><polyline points="20 6 9 17 4 12"/></Ico>,
  Book:    () => <Ico size={20}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Ico>,
  Award:   () => <Ico size={20}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></Ico>,
  Loader:  () => <Ico size={15} className="vf-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Ico>,
  Users:   () => <Ico size={32}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#2563eb","#7c3aed","#db2777","#059669","#d97706","#dc2626","#0891b2","#65a30d"]
const avatarColor   = (n) => { let h = 0; for (const c of n||"") h = (h*31 + c.charCodeAt(0))>>>0; return AVATAR_COLORS[h % AVATAR_COLORS.length] }
const initials      = (n = "") => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()

const BRANCHES       = ["CSE","AI&ML","ECE","ME","Civil","ISE","EEE","Other"]
const ADMITTED_YEARS = ["2019","2020","2021","2022","2023","2024","2025"]
const PASSOUT_YEARS  = ["2023","2024","2025","2026","2027","2028","2029"]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Colored avatar circle */
const Ava = ({ name }) => (
  <div style={{
    width:36, height:36, borderRadius:"50%", flexShrink:0,
    background: avatarColor(name), color:"#fff",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:12, fontWeight:800, boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
  }}>
    {initials(name)}
  </div>
)

/** Active / Inactive pill badge */
const StatusPill = ({ active }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:5,
    padding:"4px 11px", borderRadius:100, fontSize:12, fontWeight:700,
    background: active ? "#dcfce7" : "#fee2e2",
    color: active ? "#16a34a" : "#dc2626",
  }}>
    <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", display:"inline-block" }}/>
    {active ? "Active" : "Inactive"}
  </span>
)

/** Progress bar + % */
const Progress = ({ val }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:110 }}>
    <div style={{ flex:1, height:6, borderRadius:100, background:"#e2e8f0", overflow:"hidden" }}>
      <div style={{ width:`${val}%`, height:"100%", background:"#3b82f6", borderRadius:100, transition:"width .7s ease" }}/>
    </div>
    <span style={{ fontSize:11, color:"#64748b", minWidth:28 }}>{val}%</span>
  </div>
)

/** Labeled icon button with hover state */
const ActionButton = ({ label, icon: Icon, color, bg, hoverBg, onClick, title }) => {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"inline-flex", alignItems:"center", gap:5,
        padding:"6px 13px", borderRadius:8, border:"none",
        background: hov ? hoverBg : bg, color, cursor:"pointer",
        fontSize:12.5, fontWeight:700, fontFamily:"inherit",
        transition:"all .15s", whiteSpace:"nowrap",
      }}>
      <Icon/>{label}
    </button>
  )
}

/** Filter pill */
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:"6px 16px", borderRadius:8, fontFamily:"inherit",
    border:`1.5px solid ${active?"rgba(59,130,246,.4)":"transparent"}`,
    background: active?"rgba(59,130,246,.1)":"transparent",
    color: active?"#3b82f6":"#64748b",
    fontSize:12.5, fontWeight:600, cursor:"pointer", transition:"all .15s",
  }}>{label}</button>
)

/** Table header cell */
const TH = ({ ch }) => (
  <th style={{
    padding:"11px 16px", textAlign:"left",
    fontSize:10.5, fontWeight:700, letterSpacing:".06em",
    color:"#64748b", textTransform:"uppercase",
    background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0", whiteSpace:"nowrap",
  }}>{ch}</th>
)

/** Styled native select */
const Sel = ({ label, value, onChange, opts, ph="Select" }) => (
  <div>
    <p style={FL}>{label}</p>
    <select value={value} onChange={onChange} style={SEL_S}>
      <option value="">{ph}</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
)

/** Styled text input */
const Inp = ({ label, value, onChange, ph, type="text" }) => (
  <div>
    <p style={FL}>{label}</p>
    <input value={value} onChange={onChange} placeholder={ph} type={type}
      style={{ ...SEL_S, backgroundImage:"none" }}/>
  </div>
)

/** Toggle switch */
const Toggle = ({ checked, onChange }) => (
  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
    <span style={{ position:"relative", width:46, height:25, display:"inline-block" }}>
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{ opacity:0, width:0, height:0, position:"absolute" }}/>
      <span style={{
        position:"absolute", inset:0, borderRadius:14,
        background: checked?"#3b82f6":"#cbd5e1", transition:"background .2s",
      }}/>
      <span style={{
        position:"absolute", top:3.5, left: checked?24:3.5,
        width:18, height:18, borderRadius:"50%",
        background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
        transition:"left .2s",
      }}/>
    </span>
    <span style={{ fontSize:13.5, fontWeight:700, color: checked?"#2563eb":"#64748b" }}>
      {checked?"Active":"Inactive"}
    </span>
  </label>
)

/** Scheme card selector */
const SchemeCard = ({ value, onChange }) => (
  <div style={{ marginBottom:18 }}>
    <p style={FL}>Admission Scheme</p>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:6 }}>
      {[
        { val:"REGULAR", Icon:Icons.Book,  label:"Regular", sub:"4-year BE / B.Tech" },
        { val:"DIPLOMA", Icon:Icons.Award, label:"Diploma", sub:"Lateral / 3-year DTE" },
      ].map(({ val, Icon, label, sub }) => {
        const sel = value === val
        return (
          <button key={val} type="button" onClick={()=>onChange(val)} style={{
            padding:"12px 14px", borderRadius:12, cursor:"pointer", textAlign:"left",
            border:`2px solid ${sel?"#3b82f6":"#e2e8f0"}`,
            background: sel?"rgba(59,130,246,.07)":"#fff",
            fontFamily:"inherit", position:"relative", transition:"all .15s",
          }}>
            {sel&&<span style={{
              position:"absolute", top:8, right:8, width:18, height:18,
              background:"#3b82f6", borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
            }}><Icons.Check/></span>}
            <span style={{ color: sel?"#2563eb":"#94a3b8", display:"block", marginBottom:6 }}><Icon/></span>
            <p style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", margin:0 }}>{label}</p>
            <p style={{ fontSize:11.5, color:"#64748b", marginTop:2 }}>{sub}</p>
          </button>
        )
      })}
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Shared style objects
// ─────────────────────────────────────────────────────────────────────────────
const FL = { fontSize:11, fontWeight:700, letterSpacing:".05em", color:"#64748b", textTransform:"uppercase", margin:"0 0 5px" }
const SEL_S = {
  width:"100%", padding:"9px 12px", borderRadius:9,
  border:"1.5px solid #e2e8f0", background:"#fff", color:"#0f172a",
  fontSize:13.5, fontFamily:"inherit", outline:"none", transition:"border-color .15s",
  appearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", boxSizing:"border-box",
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const StudentsPage = () => {
  const { authFetch, admin } = useAuth()

  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState("All")
  const [rows, setRows]                   = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [limit]                           = useState(50)
  const [offset, setOffset]               = useState(0)

  const [editOpen, setEditOpen]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [editErr, setEditErr]             = useState(null)
  const [editStudent, setEditStudent]     = useState(null)
  const [editForm, setEditForm]           = useState({
    name:"", email:"", usn:"", branch:"",
    student_type:"REGULAR", admitted_year:"", passout_year:"", is_active:true,
  })

  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(()=>{
    const t = window.setTimeout(()=>setDebouncedSearch(search),300)
    return ()=>window.clearTimeout(t)
  },[search])

  const isAdmin = !!admin

  const buildPath = () => {
    const base   = isAdmin ? "/admin/students" : "/faculty/students"
    const params = new URLSearchParams()
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim())
    params.set("limit", String(limit)); params.set("offset", String(offset))
    return `${base}?${params.toString()}`
  }

  const fetchStudents = async () => {
    const token = sessionStorage.getItem("vf_token")
    if (!token) { setRows([]); setError("No token found. Please login again."); return }
    setLoading(true); setError(null)
    try {
      const res  = await authFetch(buildPath(), { method:"GET" })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error((data&&(data.detail||data.message))||`Error ${res.status}`)
      const list = Array.isArray(data) ? data : []
      setRows(list.map(s=>({
        ...s,
        faculty_mentor_name: s?.faculty_mentor_name??s?.mentor_name??s?.created_by_faculty_name??s?.faculty_name??s?.faculty??null,
      })))
    } catch(e) { setRows([]); setError(e?.message||"Failed to load students.") }
    finally { setLoading(false) }
  }

  useEffect(()=>{ fetchStudents() },[debouncedSearch,limit,offset,isAdmin]) // eslint-disable-line

  const renderStatus    = s => s?.status||(typeof s?.is_active==="boolean"?(s.is_active?"Active":"Inactive"):"Active")
  const getActivities   = s => typeof s?.activities_count==="number"?s.activities_count:typeof s?.activities==="number"?s.activities:0
  const getCertificates = s => typeof s?.certificates_count==="number"?s.certificates_count:typeof s?.certificates==="number"?s.certificates:0

  const filtered    = useMemo(()=>rows.filter(s=>statusFilter==="All"||renderStatus(s)===statusFilter),[rows,statusFilter]) // eslint-disable-line
  const activeCount = useMemo(()=>rows.filter(s=>renderStatus(s)==="Active").length,[rows]) // eslint-disable-line

  const openEdit = s => {
    setEditErr(null); setEditStudent(s)
    setEditForm({
      name:s?.name||"", email:s?.email||"", usn:s?.usn||"", branch:s?.branch||"",
      student_type:(s?.student_type||"REGULAR").toUpperCase(),
      admitted_year:String(s?.admitted_year??""),
      passout_year:String(s?.passout_year??""),
      is_active:typeof s?.is_active==="boolean"?s.is_active:true,
    })
    setEditOpen(true)
  }
  const closeEdit = () => { setEditOpen(false); setEditStudent(null); setEditErr(null) }
  const setField  = key => e => setEditForm(p=>({...p,[key]:e.target.value}))

  const saveEdit = async () => {
    if (!editStudent?.id) return
    if (!editForm.name?.trim()) { setEditErr("Full name is required."); return }
    setSaving(true); setEditErr(null)
    try {
      const payload = {
        name:editForm.name?.trim()||null, email:editForm.email?.trim()||null,
        usn:editForm.usn?.trim()||null,   branch:editForm.branch?.trim()||null,
        student_type:(editForm.student_type||"REGULAR").toUpperCase(),
        admitted_year:editForm.admitted_year?Number(editForm.admitted_year):null,
        passout_year:editForm.passout_year?Number(editForm.passout_year):null,
        is_active:!!editForm.is_active,
      }
      const res  = await authFetch(`/admin/students/${editStudent.id}`,{
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload),
      })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error((data&&(data.detail||data.message))||`Failed (${res.status})`)
      await fetchStudents(); closeEdit()
    } catch(e) { setEditErr(e?.message||"Update failed.") }
    finally { setSaving(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes vfspin { to { transform: rotate(360deg); } }
        .vf-spin { animation: vfspin 1s linear infinite; }
        @keyframes vfmodal { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:none } }
        .vf-modal { animation: vfmodal .22s ease; }
        .vf-row:hover { background: #f0f7ff !important; }
        .vf-inp:focus { border-color: #3b82f6 !important; }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

        {/* ── Page header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>Students</h2>
            <p style={{ fontSize:13, color:"#64748b", marginTop:3 }}>
              {rows.length} enrolled &nbsp;·&nbsp; {activeCount} active
            </p>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["All","Active","Inactive"].map(l=>(
              <Pill key={l} label={l} active={statusFilter===l} onClick={()=>setStatusFilter(l)}/>
            ))}
          </div>
        </div>

        {/* ── Search + Refresh ── */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", display:"flex" }}>
              <Icons.Search/>
            </span>
            <input
              value={search}
              onChange={e=>{ setSearch(e.target.value); setOffset(0) }}
              placeholder="Search by name / USN / branch / email…"
              className="vf-inp"
              style={{
                width:"100%", padding:"10px 12px 10px 38px",
                border:"1.5px solid #e2e8f0", borderRadius:10,
                fontSize:13.5, background:"#fff", color:"#0f172a",
                outline:"none", fontFamily:"inherit", boxSizing:"border-box",
                transition:"border-color .15s",
              }}
            />
          </div>
          <button onClick={fetchStudents} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"10px 16px", borderRadius:10,
            border:"1.5px solid #e2e8f0", background:"#fff",
            color:"#475569", fontSize:13.5, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
          }}>
            <Icons.Refresh/> Refresh
          </button>
        </div>

        {/* ── Table card ── */}
        <div style={{ background:"#fff", borderRadius:16, border:"1.5px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
          {loading ? (
            <div style={{ padding:48, display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"#64748b", fontSize:14 }}>
              <Icons.Loader/> Loading students…
            </div>
          ) : error ? (
            <div style={{ padding:48, textAlign:"center", color:"#dc2626", fontSize:14 }}>⚠️ {error}</div>
          ) : filtered.length===0 ? (
            <div style={{ padding:64, textAlign:"center", color:"#94a3b8" }}>
              <Icons.Users/>
              <p style={{ marginTop:12, fontSize:14, fontWeight:600 }}>No students found</p>
              <p style={{ fontSize:13, marginTop:4 }}>Adjust the search or filter.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["Student","College","Faculty Mentor","Activities","Certificates","Status","Actions"].map(h=><TH key={h} ch={h}/>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => {
                    const activities   = getActivities(s)
                    const certificates = getCertificates(s)
                    const p            = pct(certificates, activities)
                    const mentor       = (s?.faculty_mentor_name||"").toString().trim()
                    const isActive     = renderStatus(s)==="Active"

                    return (
                      <tr key={s.id} className="vf-row"
                        style={{ borderBottom:"1px solid #f1f5f9", background: idx%2===0?"#fff":"#fafcff", transition:"background .12s" }}>

                        {/* Student */}
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <Ava name={s.name}/>
                            <div>
                              <p style={{ fontSize:13.5, fontWeight:700, color:"#0f172a", margin:0 }}>{s.name}</p>
                              <p style={{ fontSize:11.5, color:"#94a3b8", marginTop:2 }}>{s.email||s.usn||"—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* College */}
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ background:"#f1f5f9", color:"#475569", padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:600 }}>
                            {s.college||"—"}
                          </span>
                        </td>

                        {/* Mentor */}
                        <td style={{ padding:"13px 16px", fontSize:13, color:"#475569" }}>{mentor||"—"}</td>

                        {/* Activities */}
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{
                            fontSize:14, fontWeight:800, color:"#0f172a",
                            background: activities>0?"rgba(59,130,246,.08)":"#f8fafc",
                            padding:"3px 11px", borderRadius:6, display:"inline-block",
                          }}>{activities}</span>
                        </td>

                        {/* Certificates */}
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:14, fontWeight:800, color:"#0f172a", minWidth:16 }}>{certificates}</span>
                            {activities>0 ? <Progress val={p}/> : <span style={{ fontSize:12, color:"#94a3b8" }}>—</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding:"13px 16px" }}><StatusPill active={isActive}/></td>

                        {/* ── Actions — clearly visible labeled buttons ── */}
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <ActionButton
                              label="View"
                              icon={Icons.Eye}
                              color="#059669"
                              bg="rgba(16,185,129,.1)"
                              hoverBg="rgba(16,185,129,.18)"
                              title="View student details"
                            />
                            {isAdmin && (
                              <ActionButton
                                label="Edit"
                                icon={Icons.Edit}
                                color="#2563eb"
                                bg="rgba(37,99,235,.1)"
                                hoverBg="rgba(37,99,235,.18)"
                                title="Edit student"
                                onClick={()=>openEdit(s)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editOpen && (
        <div
          onClick={e=>{ if(e.target===e.currentTarget) closeEdit() }}
          style={{
            position:"fixed", inset:0, background:"rgba(15,23,42,.55)",
            backdropFilter:"blur(5px)", display:"flex", alignItems:"center",
            justifyContent:"center", zIndex:200, padding:16,
          }}
        >
          <div className="vf-modal" style={{
            background:"#fff", borderRadius:20, width:600, maxWidth:"100%",
            maxHeight:"92vh", overflowY:"auto",
            boxShadow:"0 32px 80px rgba(0,0,0,0.24)",
          }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1.5px solid #f1f5f9" }}>
              <div>
                <h3 style={{ fontSize:17, fontWeight:800, color:"#0f172a", margin:0 }}>Edit Student</h3>
                <p style={{ fontSize:12.5, color:"#64748b", marginTop:3 }}>Update student profile information</p>
              </div>
              <button onClick={closeEdit} style={{
                width:34, height:34, borderRadius:9, border:"none",
                background:"#f1f5f9", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", color:"#475569",
                transition:"background .15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background="#e2e8f0"}
                onMouseLeave={e=>e.currentTarget.style.background="#f1f5f9"}
              >
                <Icons.Close/>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding:"22px 24px" }}>
              {editErr && (
                <div style={{
                  padding:"10px 14px", borderRadius:10, marginBottom:18,
                  fontSize:13, background:"rgba(239,68,68,.08)",
                  color:"#dc2626", border:"1px solid rgba(239,68,68,.2)",
                }}>
                  ⚠️ {editErr}
                </div>
              )}

              <SchemeCard value={editForm.student_type} onChange={val=>setEditForm(p=>({...p,student_type:val}))}/>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Inp label="Full Name"      value={editForm.name}          onChange={setField("name")}          ph="e.g. Rahul Sharma"/>
                <Inp label="Email Address"  value={editForm.email}         onChange={setField("email")}         ph="student@college.edu" type="email"/>
                <Inp label="USN"            value={editForm.usn}           onChange={setField("usn")}           ph="e.g. 1BG23AI001"/>
                <Sel label="Branch"         value={editForm.branch}        onChange={setField("branch")}        opts={BRANCHES}       ph="Select branch"/>
                <Sel label="Admitted Year"  value={editForm.admitted_year} onChange={setField("admitted_year")} opts={ADMITTED_YEARS} ph="Select year"/>
                <Sel label="Passout Year"   value={editForm.passout_year}  onChange={setField("passout_year")}  opts={PASSOUT_YEARS}  ph="Select year"/>

                <div style={{ gridColumn:"1 / -1", paddingTop:4 }}>
                  <p style={FL}>Account Status</p>
                  <div style={{ marginTop:8 }}>
                    <Toggle checked={!!editForm.is_active} onChange={e=>setEditForm(p=>({...p,is_active:e.target.checked}))}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, padding:"14px 24px", borderTop:"1.5px solid #f1f5f9" }}>
              <button onClick={closeEdit} disabled={saving} style={{
                padding:"9px 20px", borderRadius:9,
                border:"1.5px solid #e2e8f0", background:"#fff",
                color:"#475569", fontSize:13.5, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit",
              }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{
                padding:"9px 24px", borderRadius:9, border:"none",
                background: saving?"#93c5fd":"#2563eb", color:"#fff",
                fontSize:13.5, fontWeight:700, cursor: saving?"not-allowed":"pointer",
                fontFamily:"inherit", display:"flex", alignItems:"center", gap:7,
                transition:"background .15s",
              }}>
                {saving ? <><Icons.Loader/> Saving…</> : <><Icons.Check/> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StudentsPage