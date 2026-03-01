import { useState, useRef } from 'react'

const templateCsv = `full_name,email,college,role
John Doe,john.doe@example.com,Vidya Foundation,faculty
Jane Smith,jane.smith@example.com,Vidya Foundation,coordinator
`

// ─── Inline Modal Shell ───────────────────────────────────────────────────────
const Modal = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '1rem',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%', maxWidth: '480px',
          boxShadow: '0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────
const ImportFacultyCsvModal = ({ open, onClose, authFetch, toast, onImported }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'faculty_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (f) => { if (f?.name.endsWith('.csv')) setFile(f) }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await authFetch('/faculty/import-csv', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast?.error?.(data.detail || 'CSV import failed'); return }
      setResult(data)
      if (Array.isArray(data.created_faculty)) onImported?.(data.created_faculty)
      toast?.success?.(`Imported ${data.created_count} faculty successfully.`)
    } catch { toast?.error?.('CSV import failed') }
    finally { setUploading(false) }
  }

  const handleClose = () => { setFile(null); setResult(null); onClose?.() }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .csv-btn { cursor:pointer; transition: all .15s ease; }
        .csv-btn:hover { opacity:.85; transform:translateY(-1px); }
        .csv-btn:active { transform:translateY(0); }
        .drop-zone { transition: all .2s ease; }
        .drop-zone:hover { border-color:#3b5bdb !important; background:#f0f4ff !important; }
      `}</style>

      <Modal open={open} onClose={handleClose}>
        <div style={{ fontFamily: "'Sora', sans-serif" }}>

          {/* ── Header ── */}
          <div style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #f1f3f9',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#3b5bdb 0%,#4c6ef5 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileIcon />
                </div>
                <h2 style={{ margin:0, fontSize:'17px', fontWeight:700, color:'#0f172a', letterSpacing:'-0.3px' }}>
                  Import Faculty via CSV
                </h2>
              </div>
              <p style={{ margin:0, fontSize:'13px', color:'#64748b', paddingLeft:'46px' }}>
                Bulk-add faculty members from a spreadsheet
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background:'none', border:'none', cursor:'pointer',
                width:32, height:32, borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#94a3b8', transition:'all .15s',
                flexShrink:0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#475569' }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#94a3b8' }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '20px 28px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Template download */}
            <div style={{
              borderRadius:12, border:'1px solid #e8edf5',
              padding:'14px 16px',
              background:'#f8faff',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
            }}>
              <div>
                <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:'#1e293b' }}>
                  CSV Format
                </p>
                <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#64748b', lineHeight:1.5 }}>
                  Headers: <code style={{ background:'#e8edf5', padding:'1px 5px', borderRadius:4, fontSize:'11px', fontFamily:'monospace' }}>full_name, email, college, role</code>
                </p>
              </div>
              <button
                className="csv-btn"
                onClick={downloadTemplate}
                style={{
                  display:'flex', alignItems:'center', gap:'7px',
                  padding:'8px 14px', borderRadius:9,
                  border:'1.5px solid #c7d3f5',
                  background:'#fff', color:'#3b5bdb',
                  fontSize:'12px', fontWeight:600,
                  fontFamily:"'Sora', sans-serif",
                  flexShrink:0, whiteSpace:'nowrap',
                }}
              >
                <DownloadIcon /> Download Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              className="drop-zone"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
              style={{
                border: `2px dashed ${dragging ? '#3b5bdb' : file ? '#3b5bdb' : '#d0d9ee'}`,
                borderRadius: 14,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#f0f4ff' : file ? '#f5f7ff' : '#fafbff',
                transition: 'all .2s ease',
              }}
            >
              <input
                ref={inputRef} type="file" accept=".csv"
                style={{ display:'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
              {file ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:'linear-gradient(135deg,#3b5bdb,#4c6ef5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', marginBottom:'2px',
                  }}>
                    <FileIcon />
                  </div>
                  <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#1e293b' }}>{file.name}</p>
                  <p style={{ margin:0, fontSize:'12px', color:'#64748b' }}>
                    {(file.size / 1024).toFixed(1)} KB · <span style={{ color:'#3b5bdb', fontWeight:600 }}>Change file</span>
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                  <div style={{
                    width:44, height:44, borderRadius:12, border:'1.5px dashed #c7d3f5',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#94a3b8', marginBottom:'2px',
                  }}>
                    <UploadIcon />
                  </div>
                  <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#334155' }}>
                    Drop your CSV here
                  </p>
                  <p style={{ margin:0, fontSize:'12px', color:'#94a3b8' }}>
                    or <span style={{ color:'#3b5bdb', fontWeight:600 }}>browse files</span> — .csv only
                  </p>
                </div>
              )}
            </div>

            {/* Result banner */}
            {result && (
              <div style={{
                borderRadius:12,
                overflow:'hidden',
                border:'1px solid',
                borderColor: result.failed_count > 0 ? '#fecdd3' : '#bbf7d0',
                animation: 'slideUp .2s ease',
              }}>
                <div style={{
                  background: result.failed_count > 0 ? '#fff1f2' : '#f0fdf4',
                  padding:'12px 16px',
                  display:'flex', gap:'16px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600, color:'#15803d' }}>
                    <CheckIcon /> {result.created_count} imported
                  </div>
                  {result.failed_count > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600, color:'#dc2626' }}>
                      <AlertIcon /> {result.failed_count} failed
                    </div>
                  )}
                </div>
                {result.failed_rows?.length > 0 && (
                  <div style={{ padding:'10px 16px', background:'#fff', borderTop:'1px solid #fecdd3' }}>
                    {result.failed_rows.map((r, i) => (
                      <p key={i} style={{ margin:'3px 0', fontSize:'12px', color:'#dc2626', fontFamily:'monospace' }}>
                        Row {r.row_number}: {r.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px' }}>
              <button
                className="csv-btn"
                onClick={handleClose}
                style={{
                  padding:'10px 20px', borderRadius:10,
                  border:'1.5px solid #e2e8f0',
                  background:'#fff', color:'#475569',
                  fontSize:'13px', fontWeight:600,
                  fontFamily:"'Sora', sans-serif", cursor:'pointer',
                }}
              >
                Cancel
              </button>

              <button
                className="csv-btn"
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  padding:'10px 22px', borderRadius:10,
                  border:'none',
                  background: (!file || uploading)
                    ? '#c7d3f5'
                    : 'linear-gradient(135deg,#3b5bdb 0%,#4c6ef5 100%)',
                  color:'#fff',
                  fontSize:'13px', fontWeight:600,
                  fontFamily:"'Sora', sans-serif",
                  cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:'8px',
                  boxShadow: (!file || uploading) ? 'none' : '0 4px 14px rgba(59,91,219,.35)',
                  transition:'all .2s ease',
                }}
              >
                {uploading ? (
                  <>
                    <span style={{
                      width:13, height:13, border:'2px solid rgba(255,255,255,.4)',
                      borderTopColor:'#fff', borderRadius:'50%',
                      display:'inline-block',
                      animation:'spin .7s linear infinite',
                    }}/>
                    Uploading…
                  </>
                ) : (
                  <><UploadIcon /> Import Faculty</>
                )}
              </button>
            </div>

          </div>
        </div>
      </Modal>
    </>
  )
}

export default ImportFacultyCsvModal

// ─── Demo / Preview ───────────────────────────────────────────────────────────
export const Preview = () => {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding:'10px 22px', borderRadius:10, border:'none',
          background:'linear-gradient(135deg,#3b5bdb,#4c6ef5)',
          color:'#fff', fontFamily:"'Sora',sans-serif", fontSize:'13px', fontWeight:600, cursor:'pointer',
        }}
      >
        Open Modal
      </button>
      <ImportFacultyCsvModal
        open={open}
        onClose={() => setOpen(false)}
        authFetch={async () => new Response(JSON.stringify({ created_count:3, failed_count:1, created_faculty:[], failed_rows:[{row_number:4,error:'Duplicate email'}] }))}
        toast={{ success: console.log, error: console.error }}
        onImported={console.log}
      />
    </div>
  )
}