"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Image as ImageIcon, ImageUp, Loader2, Search, Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "")

export type MediaPickerItem = {
  id?: string
  asset_id?: string | null
  url: string
  type?: "image" | "video"
  storage_path?: string | null
  width?: number | null
  height?: number | null
  format?: string | null
  original_filename?: string | null
  source?: string | null
  alt?: string | null
  sort_order?: number
  assignments?: Array<{ kind: string; owner_id: string; slot: string; label: string; sort_order: number }>
  file_exists?: boolean | null
}

function token() {
  return typeof window === "undefined" ? "" : localStorage.getItem("riverside_admin_token") || ""
}

function displayUrl(item: MediaPickerItem) {
  const url = item.url || ""
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url
  return `${PUBLIC_SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

function asMediaItem(asset: MediaPickerItem): MediaPickerItem {
  return {
    asset_id: asset.asset_id || asset.id || null,
    url: asset.url,
    type: asset.type || "image",
    storage_path: asset.storage_path || null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    format: asset.format ?? null,
    original_filename: asset.original_filename || null,
    source: asset.source || null,
    alt: asset.alt || null,
    sort_order: asset.sort_order ?? 0,
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token()}`,
      ...(options?.headers || {}),
    },
  })
  if (!response.ok) {
    let detail = response.statusText
    try {
      const data = await response.json()
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
    } catch {}
    throw new Error(detail)
  }
  return response.json()
}

export function MediaPicker({
  label = "Chọn ảnh",
  multiple = false,
  accept = "image",
  selected = [],
  onSelect,
}: {
  label?: string
  multiple?: boolean
  accept?: "image" | "video" | "all"
  selected?: MediaPickerItem[]
  onSelect: (items: MediaPickerItem[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [assets, setAssets] = useState<MediaPickerItem[]>([])
  const [chosen, setChosen] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await request<MediaPickerItem[]>("/admin/media-assets")
      setAssets(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được media")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setChosen(selected.map((item) => item.asset_id || item.id || "").filter(Boolean) as string[])
    void load()
  }, [open])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...assets]
      .filter((item) => accept === "all" || (item.type || "image") === accept)
      .filter((item) => !normalized || `${item.original_filename || ""} ${item.storage_path || ""} ${item.assignments?.map((x) => x.label).join(" ") || ""}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aRank = a.source === "local" ? 0 : a.source === "seed" ? 2 : 1
        const bRank = b.source === "local" ? 0 : b.source === "seed" ? 2 : 1
        if (aRank !== bRank) return aRank - bRank
        return 0
      })
  }, [assets, accept, query])

  const toggle = (asset: MediaPickerItem) => {
    if (asset.file_exists === false) return
    const id = asset.id || asset.asset_id
    if (!id) return
    if (!multiple) {
      setChosen([id])
      return
    }
    setChosen((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const confirmSelection = () => {
    const byId = new Map(assets.map((asset) => [asset.id || asset.asset_id, asset]))
    const result = chosen.map((id) => byId.get(id)).filter(Boolean).map((item) => asMediaItem(item as MediaPickerItem))
    onSelect(result)
    setOpen(false)
  }

  const scanFolder = async () => {
    setScanning(true)
    setError("")
    setScanMessage("")
    try {
      const result = await request<{ imported: number; supported_files: number; skipped_existing: number; error_count: number }>("/admin/media-assets/scan", { method: "POST" })
      setScanMessage(`Quét xong: thêm ${result.imported} media mới · ${result.skipped_existing} file đã có trong DB${result.error_count ? ` · ${result.error_count} lỗi` : ""}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không quét được thư mục media")
    } finally {
      setScanning(false)
    }
  }

  const uploadFiles = async (files?: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError("")
    try {
      const uploaded: MediaPickerItem[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const item = await request<MediaPickerItem>("/admin/uploads/media", { method: "POST", body: fd })
        uploaded.push(item)
      }
      await load()
      const ids = uploaded.map((item) => item.asset_id || item.id || "").filter(Boolean) as string[]
      setChosen((prev) => multiple ? Array.from(new Set([...ids, ...prev])) : ids.slice(0, 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại")
    } finally {
      setUploading(false)
    }
  }

  return <>
    <Button type="button" variant="outline" onClick={() => setOpen(true)}>
      <ImageIcon size={15} className="mr-2" />{label}
    </Button>
    {open ? <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-lg font-semibold">Media Library</h2><p className="text-xs text-gray-500">Ảnh upload gần đây được ưu tiên. Một asset có thể dùng ở nhiều chỗ.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={scanning} onClick={() => void scanFolder()}><Search size={15} className="mr-2" />{scanning ? "Đang quét..." : "Quét thư mục"}</Button><label className="inline-flex h-10 cursor-pointer items-center rounded-md bg-black px-4 text-sm font-medium text-white"><ImageUp size={15} className="mr-2" />{uploading ? "Đang upload..." : "Upload ảnh mới"}<input type="file" className="hidden" multiple={multiple} accept={accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*"} disabled={uploading} onChange={(e) => { void uploadFiles(e.target.files); e.currentTarget.value = "" }} /></label><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}><X size={18} /></Button></div>
        </div>
        <div className="border-b p-4"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input className="pl-9" placeholder="Tìm filename, vị trí đang dùng..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>{scanMessage ? <p className="mt-2 text-sm text-green-700">{scanMessage}</p> : null}{error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex min-h-48 items-center justify-center text-gray-500"><Loader2 className="mr-2 animate-spin" size={18} />Đang tải media...</div> : null}
          {!loading && !filtered.length ? <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">Chưa có media phù hợp. Upload ảnh mới ở góc trên.</div> : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
            {filtered.map((asset) => {
              const id = asset.id || asset.asset_id || ""
              const active = chosen.includes(id)
              const missing = asset.file_exists === false
              return <button type="button" key={id || asset.url} disabled={missing} onClick={() => toggle(asset)} className={`overflow-hidden rounded-xl border text-left transition ${missing ? "cursor-not-allowed border-red-200 opacity-70" : active ? "border-black ring-2 ring-black/20" : "border-gray-200 hover:border-gray-400"}`}>
                <div className="relative aspect-[3/2] bg-gray-100">{missing ? <div className="flex h-full items-center justify-center px-3 text-center text-xs font-medium text-red-600">File không còn trên ổ đĩa</div> : asset.type === "video" ? <video src={displayUrl(asset)} muted className="h-full w-full object-cover" /> : <img src={displayUrl(asset)} alt={asset.original_filename || "media"} className="h-full w-full object-cover" />}{active && !missing ? <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"><Check size={15} /></span> : null}<span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-medium ${missing ? "bg-red-600 text-white" : asset.source === "local" ? "bg-green-600 text-white" : "bg-white/90 text-gray-700"}`}>{missing ? "MISSING" : asset.source === "local" ? "UPLOADED" : (asset.source || "MEDIA").toUpperCase()}</span></div>
                <div className="p-2"><p className="truncate text-xs font-medium">{asset.original_filename || asset.storage_path || "Media"}</p><p className="mt-1 truncate text-[10px] text-gray-500">{asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.type}</p><p className="mt-1 line-clamp-2 min-h-7 text-[9px] text-blue-600">{asset.assignments?.length ? asset.assignments.map((x) => x.label).join(" · ") : "Chưa được gán"}</p></div>
              </button>
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t p-4"><p className="text-xs text-gray-500">Đã chọn {chosen.length}{multiple ? " asset" : ""}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Huỷ</Button><Button type="button" disabled={!chosen.length} onClick={confirmSelection}>Dùng ảnh đã chọn</Button></div></div>
      </div>
    </div> : null}
  </>
}
