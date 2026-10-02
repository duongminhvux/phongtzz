"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, CalendarDays, Edit, Eye, EyeOff, Home, ImageUp, LayoutDashboard, LogOut, MessageSquare, Plus, Save, Search, Trash, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToursAdminPanel, TourBookingsAdminPanel } from "@/tours-panel"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "")

type BookingStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CANCELLED"
type MediaItem = { asset_id?: string | null; url: string; type?: "image" | "video"; storage_path?: string | null; width?: number | null; height?: number | null; format?: string | null; original_filename?: string | null; source?: string | null; alt?: string | null; sort_order?: number }
type MediaAssignment = { kind: string; owner_id: string; slot: string; label: string; sort_order: number }
type MediaAsset = { id: string; url: string; storage_path?: string | null; type: "image" | "video"; width?: number | null; height?: number | null; format?: string | null; original_filename?: string | null; source: string; created_at: string; assignments: MediaAssignment[] }
type LandingSectionType = "hero" | "welcome" | "experiences" | "rooms" | "amenities" | "testimonials" | "gallery" | "banner" | "cta"
type LandingSection = Record<string, any> & { id: string; type: LandingSectionType; enabled?: boolean; sort_order?: number }
type LandingConfig = Record<string, any> & { brand: Record<string, any>; theme: Record<string, any>; header: Record<string, any>; footer: Record<string, any>; contact: Record<string, any>; roomsPage: Record<string, any>; sections: LandingSection[] }

type Room = {
  id: string
  name: string
  slug: string
  type: string
  price?: number | null
  original_price?: number | null
  capacity?: number | null
  beds?: number | null
  bed_type?: string | null
  size?: string | null
  description?: string | null
  amenities: string[]
  highlights: string[]
  images: MediaItem[]
  is_active: boolean
  sort_order: number
}

type BookingRequest = {
  id: string
  full_name: string
  phone: string
  email?: string | null
  check_in?: string | null
  check_out?: string | null
  guests?: number | null
  message?: string | null
  status: BookingStatus
  internal_note?: string | null
  source?: string | null
  room?: Room | null
  created_at: string
}

type Section = "dashboard" | "bookings" | "tour-bookings" | "rooms" | "tours" | "landing" | "media"

type RoomForm = {
  id?: string
  name: string
  slug: string
  type: string
  price: string
  original_price: string
  capacity: string
  beds: string
  bed_type: string
  size: string
  description: string
  amenities: string
  highlights: string
  images: MediaItem[]
  is_active: boolean
  sort_order: string
}

const emptyRoomForm: RoomForm = {
  name: "",
  slug: "",
  type: "private",
  price: "",
  original_price: "",
  capacity: "2",
  beds: "1",
  bed_type: "",
  size: "",
  description: "",
  amenities: "",
  highlights: "",
  images: [],
  is_active: true,
  sort_order: "0",
}

const emptyLanding: LandingConfig = {
  brand: { name: "", logoText: "", phone: "", email: "", address: "", facebookUrl: "", instagramUrl: "", logo: null },
  theme: { fontFamily: "", headingFont: "", primaryColor: "#111111", backgroundColor: "#f7f5f2" },
  header: { ctaText: "", ctaLink: "/contact", navItems: [] },
  footer: { showCta: true, bottomText: "", quickLinksTitle: "", contactTitle: "", socialTitle: "", copyrightText: "", mapEmbedUrl: "" },
  contact: { title: "", description: "", successTitle: "", successMessage: "", eyebrow: "", infoTitle: "", infoDescription: "", addressLabel: "", phoneLabel: "", emailLabel: "", submitText: "", submittingText: "", submitNote: "", sendAnotherText: "" },
  roomsPage: { eyebrow: "", title: "", description: "", filters: [], emptyImageText: "", bookingOnlyText: "", amenitiesTitle: "", bookingButtonText: "", bookingNote: "", contactPriceText: "", priceSuffix: "", guestsSuffix: "", bedFallback: "", noRoomsText: "" },
  sections: [],
}

function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("riverside_admin_token") || ""
}
function saveToken(token: string) { localStorage.setItem("riverside_admin_token", token) }
function clearToken() { localStorage.removeItem("riverside_admin_token") }
function splitList(value: string) { return value.split("\n").flatMap((line) => line.split(",")).map((item) => item.trim()).filter(Boolean) }
function joinList(value?: string[]) { return (value || []).join("\n") }
function formatDate(value?: string | null) { if (!value) return "-"; return new Intl.DateTimeFormat("vi-VN").format(new Date(value)) }
function mediaUrl(item?: MediaItem | string | null) { return typeof item === "string" ? item : item?.url || "" }
function displayMediaUrl(item?: MediaItem | MediaAsset | string | null) { const url = typeof item === "string" ? item : item?.url || ""; if (!url || /^(https?:|data:|blob:)/i.test(url)) return url; return `${PUBLIC_SITE_URL}${url.startsWith("/") ? "" : "/"}${url}` }
function normalizeMediaList(value: any): MediaItem[] {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => typeof item === "string" ? { url: item, type: item.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image", sort_order: index } : { ...item, sort_order: item?.sort_order ?? index })
    .filter((item) => item.url)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}
function normalizeRoom(room: Room): Room { return { ...room, images: normalizeMediaList(room.images) } }
function uid(prefix = "section") { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}` }

function normalizeLanding(value: any): LandingConfig {
  const source = value || {}
  const sections = (Array.isArray(source.sections) ? source.sections : [])
    .map((raw: LandingSection, index: number) => {
      const section: LandingSection = { ...raw, id: raw.id || uid(raw.type), enabled: raw.enabled !== false, sort_order: raw.sort_order ?? index + 1 }
      if (section.type === "hero" || section.type === "banner") section.image = section.image ? normalizeMediaList([section.image])[0] || null : null
      if (section.type === "hero") section.video = section.video ? normalizeMediaList([section.video])[0] || null : null
      if (section.type === "welcome" || section.type === "gallery") section.images = normalizeMediaList(section.images)
      if (section.type === "experiences") section.items = (section.items || []).map((item: any) => ({ ...item, image: item.image ? normalizeMediaList([item.image])[0] || null : null }))
      return section
    })
    .sort((a: LandingSection, b: LandingSection) => (a.sort_order || 0) - (b.sort_order || 0))
  return {
    ...source,
    brand: { ...emptyLanding.brand, ...(source.brand || {}), logo: source.brand?.logo ? normalizeMediaList([source.brand.logo])[0] || null : null },
    theme: { ...emptyLanding.theme, ...(source.theme || {}) },
    header: { ...emptyLanding.header, ...(source.header || {}) },
    footer: { ...emptyLanding.footer, ...(source.footer || {}) },
    contact: { ...emptyLanding.contact, ...(source.contact || {}) },
    roomsPage: { ...emptyLanding.roomsPage, ...(source.roomsPage || {}) },
    sections,
  }
}

function serializeLanding(landing: LandingConfig): LandingConfig {
  return { ...landing, sections: landing.sections.map((section, index) => ({ ...section, sort_order: index + 1 })) }
}

function statusClass(status: BookingStatus) {
  switch (status) {
    case "NEW": return "bg-blue-50 text-blue-700"
    case "CONTACTED": return "bg-amber-50 text-amber-700"
    case "CONFIRMED": return "bg-green-50 text-green-700"
    case "CANCELLED": return "bg-red-50 text-red-700"
  }
}

export default function Dashboard() {
  const [token, setTokenState] = useState("")
  const [email, setEmail] = useState("admin@riversidehaven.local")
  const [password, setPassword] = useState("admin123456")
  const [section, setSection] = useState<Section>("dashboard")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [landing, setLanding] = useState<LandingConfig>(emptyLanding)
  const [bookingQuery, setBookingQuery] = useState("")
  const [bookingStatus, setBookingStatus] = useState("")
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm)
  const [roomDirty, setRoomDirty] = useState(false)
  const roomRevision = useRef(0)
  const roomSaveQueue = useRef<Promise<void>>(Promise.resolve())
  const [landingDirty, setLandingDirty] = useState(false)
  const landingRevision = useRef(0)
  const landingSaveQueue = useRef<Promise<void>>(Promise.resolve())

  const stats = useMemo(() => ({
    totalBookings: bookings.length,
    newBookings: bookings.filter((item) => item.status === "NEW").length,
    contacted: bookings.filter((item) => item.status === "CONTACTED").length,
    rooms: rooms.length,
  }), [bookings, rooms])

  const authHeaders = () => ({ Authorization: `Bearer ${token || getToken()}` })
  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      cache: options?.cache ?? "no-store",
      ...options,
      headers: { ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...authHeaders(), ...(options?.headers || {}) },
    })
    if (!response.ok) {
      let detail = response.statusText
      try { const data = await response.json(); detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail) } catch {}
      throw new Error(detail)
    }
    if (response.status === 204) return undefined as T
    return response.json()
  }

  async function loadAll() {
    if (!getToken()) return
    setLoading(true); setError("")
    try {
      const [bookingData, roomData, landingData, mediaData] = await Promise.all([
        api<BookingRequest[]>("/admin/booking-requests"),
        api<Room[]>("/admin/rooms"),
        api<{ value: Record<string, unknown> }>("/admin/landing-page"),
        api<MediaAsset[]>("/admin/media-assets"),
      ])
      setBookings(bookingData)
      setRooms(roomData.map(normalizeRoom))
      setLanding(normalizeLanding(landingData.value))
      setMediaAssets(mediaData)
      setLandingDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu")
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const saved = getToken()
    if (saved) { setTokenState(saved); loadAll() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("")
    try {
      const data = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then(async (res) => {
        if (!res.ok) { const data = await res.json().catch(() => null); throw new Error(data?.detail || "Sai email hoặc mật khẩu") }
        return res.json()
      })
      saveToken(data.access_token); setTokenState(data.access_token); setMessage("Đăng nhập thành công"); await loadAll()
    } catch (err) { setError(err instanceof Error ? err.message : "Đăng nhập lỗi") }
    finally { setLoading(false) }
  }

  function logout() { clearToken(); setTokenState("") }
  async function refreshBookings() {
    const params = new URLSearchParams(); if (bookingQuery) params.set("q", bookingQuery); if (bookingStatus) params.set("status", bookingStatus)
    setBookings(await api<BookingRequest[]>(`/admin/booking-requests?${params.toString()}`))
  }
  async function updateBooking(id: string, payload: Partial<Pick<BookingRequest, "status" | "internal_note">>) {
    try { await api(`/admin/booking-requests/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); setMessage("Đã cập nhật booking request"); await refreshBookings() } catch (err) { setError(err instanceof Error ? err.message : "Không cập nhật được") }
  }
  async function deleteBooking(id: string) { if (!confirm("Xoá booking request này?")) return; await api(`/admin/booking-requests/${id}`, { method: "DELETE" }); await refreshBookings() }

  function roomPayload(form: RoomForm) {
    return { name: form.name, slug: form.slug || undefined, type: form.type || "private", price: form.price ? Number(form.price) : null, original_price: form.original_price ? Number(form.original_price) : null, capacity: form.capacity ? Number(form.capacity) : null, beds: form.beds ? Number(form.beds) : null, bed_type: form.bed_type || null, size: form.size || null, description: form.description || null, amenities: splitList(form.amenities), highlights: splitList(form.highlights), images: form.images.map((item, index) => ({ ...item, sort_order: index })), is_active: form.is_active, sort_order: Number(form.sort_order || 0) }
  }

  const updateRoomForm: React.Dispatch<React.SetStateAction<RoomForm>> = (action) => {
    roomRevision.current += 1
    setRoomDirty(true)
    setRoomForm(action)
  }

  function editRoom(room: Room) {
    roomRevision.current += 1
    setRoomDirty(false)
    setRoomForm({ id: room.id, name: room.name, slug: room.slug, type: room.type, price: room.price?.toString() || "", original_price: room.original_price?.toString() || "", capacity: room.capacity?.toString() || "", beds: room.beds?.toString() || "", bed_type: room.bed_type || "", size: room.size || "", description: room.description || "", amenities: joinList(room.amenities), highlights: joinList(room.highlights), images: normalizeMediaList(room.images), is_active: room.is_active, sort_order: room.sort_order?.toString() || "0" })
    setSection("rooms")
  }

  async function persistExistingRoom(showMessage = false) {
    if (!roomForm.id || roomForm.name.trim().length < 2) return
    const revision = roomRevision.current
    const snapshot = { ...roomForm, images: roomForm.images.map((item) => ({ ...item })) }
    const task = async () => {
      try {
        const saved = normalizeRoom(await api<Room>(`/admin/rooms/${snapshot.id}`, { method: "PATCH", body: JSON.stringify(roomPayload(snapshot)) }))
        if (roomRevision.current === revision) setRoomDirty(false)
        setRooms((prev) => prev.map((room) => room.id === saved.id ? saved : room).sort((a, b) => a.sort_order - b.sort_order))
        void refreshMediaAssets()
        if (showMessage) setMessage("Đã lưu phòng vào DB")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không lưu được phòng")
      }
    }
    roomSaveQueue.current = roomSaveQueue.current.catch(() => undefined).then(task)
    await roomSaveQueue.current
  }

  async function saveRoom(event: React.FormEvent) {
    event.preventDefault()
    if (roomForm.id) {
      await persistExistingRoom(true)
      return
    }
    try {
      await api("/admin/rooms", { method: "POST", body: JSON.stringify(roomPayload(roomForm)) })
      roomRevision.current += 1
      setRoomDirty(false)
      setRoomForm(emptyRoomForm)
      setMessage("Đã thêm phòng vào DB")
      setRooms((await api<Room[]>("/admin/rooms")).map(normalizeRoom))
      void refreshMediaAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được phòng")
    }
  }
  async function deleteRoom(id: string) { if (!confirm("Xoá phòng này?")) return; await api(`/admin/rooms/${id}`, { method: "DELETE" }); setRooms((await api<Room[]>("/admin/rooms")).map(normalizeRoom)); void refreshMediaAssets() }

  async function deleteMediaAsset(id: string) {
    if (!confirm("Delete this media asset? It must be unassigned first.")) return
    try { await api(`/admin/media-assets/${id}`, { method: "DELETE" }); setMessage("Media asset deleted"); await refreshMediaAssets() }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete media asset") }
  }

  async function refreshMediaAssets() {
    try { setMediaAssets(await api<MediaAsset[]>("/admin/media-assets")) } catch (err) { setError(err instanceof Error ? err.message : "Could not load media library") }
  }

  async function uploadMedia(file?: File): Promise<MediaItem | null> {
    if (!file) return null
    const formData = new FormData(); formData.append("file", file)
    try { const data = await api<MediaItem>("/admin/uploads/media", { method: "POST", body: formData }); setMessage(`Uploaded ${data.original_filename || data.storage_path || data.type}. Asset is now stored in DB; assigning it to landing/room will save the relation.`); void refreshMediaAssets(); return data }
    catch (err) { setError(err instanceof Error ? err.message : "Upload lỗi"); return null }
  }

  const updateLanding: React.Dispatch<React.SetStateAction<LandingConfig>> = (action) => {
    landingRevision.current += 1
    setLandingDirty(true)
    setLanding(action)
  }

  async function saveLanding(showMessage = true) {
    const revision = landingRevision.current
    const snapshot = serializeLanding(landing)
    const task = async () => {
      try {
        const saved = await api<{ value: Record<string, unknown> }>("/admin/landing-page", { method: "PUT", body: JSON.stringify({ value: snapshot }) })
        if (landingRevision.current === revision) {
          setLanding(normalizeLanding(saved.value))
          setLandingDirty(false)
          void refreshMediaAssets()
        }
        if (showMessage) setMessage("Đã lưu landing page vào DB")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không lưu được landing")
      }
    }
    landingSaveQueue.current = landingSaveQueue.current.catch(() => undefined).then(task)
    await landingSaveQueue.current
  }

  useEffect(() => {
    if (!token || !roomDirty || !roomForm.id || roomForm.name.trim().length < 2) return
    const timer = window.setTimeout(() => { void persistExistingRoom(false) }, 700)
    return () => window.clearTimeout(timer)
    // Existing rooms are full-overwrite PATCHed after the admin stops editing briefly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomForm, roomDirty, token])

  useEffect(() => {
    if (!token || !landingDirty) return
    const timer = window.setTimeout(() => { void saveLanding(false) }, 700)
    return () => window.clearTimeout(timer)
    // Save the latest full landing snapshot after the admin stops typing/changing media briefly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landing, landingDirty, token])

  if (!token) return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Riverside Haven Admin</CardTitle><CardDescription>Đăng nhập để quản lý phòng, tour, booking requests, media và landing page.</CardDescription></CardHeader><CardContent>
        <form onSubmit={handleLogin} className="space-y-4"><div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<Button className="w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Login"}</Button></form>
      </CardContent></Card>
    </main>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 border-r bg-white md:block"><div className="border-b p-6"><h1 className="text-2xl font-semibold text-purple-600">Riverside Haven</h1><p className="mt-1 text-sm text-gray-500">Booking Request Admin</p></div><nav className="space-y-1 p-3"><NavButton active={section === "dashboard"} onClick={() => setSection("dashboard")} icon={<LayoutDashboard size={18} />} label="Dashboard" /><NavButton active={section === "bookings"} onClick={() => setSection("bookings")} icon={<MessageSquare size={18} />} label="Room Bookings" /><NavButton active={section === "tour-bookings"} onClick={() => setSection("tour-bookings")} icon={<CalendarDays size={18} />} label="Tour Bookings" /><NavButton active={section === "rooms"} onClick={() => setSection("rooms")} icon={<Home size={18} />} label="Rooms" /><NavButton active={section === "tours"} onClick={() => setSection("tours")} icon={<CalendarDays size={18} />} label="Tours" /><NavButton active={section === "landing"} onClick={() => setSection("landing")} icon={<Edit size={18} />} label="Landing Builder" /><NavButton active={section === "media"} onClick={() => setSection("media")} icon={<ImageUp size={18} />} label="Media Library" /></nav></aside>
      <main className="flex-1"><header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8"><div><h2 className="text-xl font-semibold">{sectionTitle(section)}</h2><p className="text-sm text-gray-500">Landing dùng dữ liệu trong DB, admin quyết định hiển thị gì.</p></div><div className="flex items-center gap-2"><Button variant="outline" onClick={loadAll} disabled={loading}>Refresh</Button><Button variant="ghost" onClick={logout}><LogOut size={16} className="mr-2" />Logout</Button></div></header>
        <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">{message ? <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}{error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {section === "dashboard" ? <DashboardSection stats={stats} bookings={bookings.slice(0, 5)} /> : null}
          {section === "bookings" ? <BookingsSection bookings={bookings} query={bookingQuery} status={bookingStatus} setQuery={setBookingQuery} setStatus={setBookingStatus} refresh={refreshBookings} updateBooking={updateBooking} deleteBooking={deleteBooking} /> : null}
          {section === "tour-bookings" ? <TourBookingsAdminPanel /> : null}
          {section === "rooms" ? <RoomsSection rooms={rooms} form={roomForm} setForm={updateRoomForm} saveRoom={saveRoom} editRoom={editRoom} deleteRoom={deleteRoom} uploadMedia={uploadMedia} /> : null}
          {section === "tours" ? <ToursAdminPanel /> : null}
          {section === "landing" ? <LandingBuilder landing={landing} setLanding={updateLanding} rooms={rooms} save={saveLanding} uploadMedia={uploadMedia} /> : null}
          {section === "media" ? <MediaLibrary assets={mediaAssets} refresh={refreshMediaAssets} deleteAsset={deleteMediaAsset} /> : null}
        </div>
      </main>
    </div>
  )
}

function sectionTitle(section: Section) { return section === "dashboard" ? "Dashboard" : section === "bookings" ? "Room Booking Requests" : section === "tour-bookings" ? "Tour Booking Requests" : section === "rooms" ? "Rooms" : section === "tours" ? "Tours" : section === "media" ? "Media Library" : "Landing Page Builder" }
function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>{icon}{label}</button> }
function DashboardSection({ stats, bookings }: { stats: any; bookings: BookingRequest[] }) { return <><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><StatCard title="Total Requests" value={stats.totalBookings} icon={<MessageSquare />} /><StatCard title="New" value={stats.newBookings} icon={<CalendarDays />} /><StatCard title="Contacted" value={stats.contacted} icon={<Search />} /><StatCard title="Rooms" value={stats.rooms} icon={<Home />} /></div><Card><CardHeader><CardTitle>Latest booking requests</CardTitle></CardHeader><CardContent><BookingTable bookings={bookings} /></CardContent></Card></> }
function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold">{value}</p></div><div className="rounded-full bg-blue-50 p-3 text-blue-600">{icon}</div></CardContent></Card> }

function BookingsSection(props: { bookings: BookingRequest[]; query: string; status: string; setQuery: (v: string) => void; setStatus: (v: string) => void; refresh: () => void; updateBooking: (id: string, payload: Partial<Pick<BookingRequest, "status" | "internal_note">>) => void; deleteBooking: (id: string) => void }) { return <Card><CardHeader><CardTitle>Booking Requests</CardTitle><CardDescription>Quản lý khách gửi yêu cầu đặt phòng. Không check phòng trống tự động.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 md:flex-row"><Input placeholder="Tìm tên / SĐT / email" value={props.query} onChange={(e) => props.setQuery(e.target.value)} /><select className="rounded-md border px-3 py-2 text-sm" value={props.status} onChange={(e) => props.setStatus(e.target.value)}><option value="">All status</option><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option></select><Button onClick={props.refresh}><Search size={16} className="mr-2" />Filter</Button></div><BookingTable bookings={props.bookings} updateBooking={props.updateBooking} deleteBooking={props.deleteBooking} editable /></CardContent></Card> }
function BookingTable({ bookings, editable, updateBooking, deleteBooking }: { bookings: BookingRequest[]; editable?: boolean; updateBooking?: any; deleteBooking?: any }) { return <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Khách</TableHead><TableHead>Ngày</TableHead><TableHead>Phòng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ghi chú</TableHead>{editable ? <TableHead>Action</TableHead> : null}</TableRow></TableHeader><TableBody>{bookings.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.full_name}</p><p className="text-xs text-gray-500">{item.phone} · {item.email || "no email"}</p><p className="text-xs text-gray-400">{formatDate(item.created_at)}</p></TableCell><TableCell><p>{formatDate(item.check_in)} → {formatDate(item.check_out)}</p><p className="text-xs text-gray-500">{item.guests || 1} khách</p></TableCell><TableCell>{item.room?.name || "Chưa chọn"}</TableCell><TableCell>{editable ? <select className="rounded-md border px-2 py-1 text-xs" value={item.status} onChange={(e) => updateBooking(item.id, { status: e.target.value })}><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option></select> : <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>}</TableCell><TableCell className="min-w-[260px]"><p className="text-xs text-gray-500">Khách: {item.message || "-"}</p>{editable ? <Textarea defaultValue={item.internal_note || ""} onBlur={(e) => updateBooking(item.id, { internal_note: e.target.value })} placeholder="Ghi chú nội bộ" className="mt-2 min-h-16" /> : <p className="text-xs text-gray-500">Admin: {item.internal_note || "-"}</p>}</TableCell>{editable ? <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBooking(item.id)}><Trash size={16} /></Button></TableCell> : null}</TableRow>)}</TableBody></Table></div> }

function MediaLibrary({ assets, refresh, deleteAsset }: { assets: MediaAsset[]; refresh: () => void; deleteAsset: (id: string) => void }) {
  const assigned = assets.filter((asset) => asset.assignments.length > 0).length
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Media Library</CardTitle><CardDescription>{assets.length} assets in DB, {assigned} currently assigned. Uploading writes the file to persistent local storage and creates the DB asset immediately; landing/room/tour saves create assignments.</CardDescription></div><Button variant="outline" onClick={refresh}>Refresh</Button></div></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => <div key={asset.id} className="rounded-xl border bg-white p-3"><div className="h-44 overflow-hidden rounded-lg bg-gray-100">{asset.type === "video" ? <video src={displayMediaUrl(asset)} className="h-full w-full object-cover" muted controls /> : <img src={displayMediaUrl(asset)} alt={asset.original_filename || asset.storage_path || "media"} className="h-full w-full object-cover" />}</div><div className="mt-3 space-y-1"><p className="truncate text-sm font-medium" title={asset.original_filename || asset.storage_path || asset.url}>{asset.original_filename || asset.storage_path || "Media asset"}</p><p className="text-xs text-gray-500">{asset.type} {asset.width && asset.height ? `- ${asset.width}x${asset.height}` : ""} - {asset.source}</p><p className="truncate text-[11px] text-gray-400" title={asset.storage_path || asset.url}>{asset.storage_path || asset.url}</p><p className="truncate text-[10px] text-gray-400" title={asset.id}>Asset ID: {asset.id}</p></div><div className="mt-3 space-y-1">{asset.assignments.length ? asset.assignments.map((assignment, index) => <div key={`${assignment.slot}-${index}`} className="rounded-md bg-blue-50 px-2 py-1.5 text-xs text-blue-700"><span className="font-medium">{assignment.label}</span><span className="ml-1 text-blue-500">{assignment.slot}{(assignment.kind === "room" || assignment.kind === "tour") ? ` #${assignment.sort_order + 1}` : ""}</span></div>) : <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">Unassigned asset</div>}</div><div className="mt-3 flex justify-end">{asset.assignments.length === 0 ? <Button size="sm" variant="ghost" onClick={() => deleteAsset(asset.id)}><Trash size={14} className="mr-1" />Delete</Button> : null}</div></div>)}</div></CardContent></Card>
}

function RoomsSection(props: { rooms: Room[]; form: RoomForm; setForm: React.Dispatch<React.SetStateAction<RoomForm>>; saveRoom: (e: React.FormEvent) => void; editRoom: (room: Room) => void; deleteRoom: (id: string) => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const f = props.form
  const set = (key: keyof RoomForm, value: any) => props.setForm((prev) => ({ ...prev, [key]: value }))
  async function addFiles(files?: FileList | null) {
    if (!files) return
    const uploaded: MediaItem[] = []
    for (const file of Array.from(files)) { const media = await props.uploadMedia(file); if (media) uploaded.push(media) }
    if (uploaded.length) props.setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded].map((item, index) => ({ ...item, sort_order: index })) }))
  }
  const reorder = (from: number, to: number) => props.setForm((prev) => { if (to < 0 || to >= prev.images.length) return prev; const arr = [...prev.images]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved); return { ...prev, images: arr.map((item, index) => ({ ...item, sort_order: index })) } })
  const removeImage = (index: number) => props.setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })) }))
  async function replaceImage(index: number, file?: File) { const media = await props.uploadMedia(file); if (!media) return; props.setForm((prev) => ({ ...prev, images: prev.images.map((item, i) => i === index ? { ...media, sort_order: index } : item) })) }
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-5"><Card className="lg:col-span-2"><CardHeader><CardTitle>{f.id ? `Edit room: ${f.name}` : "Create room"}</CardTitle><CardDescription>Room gallery order below is the exact order stored in room_media and returned to the public frontend.</CardDescription></CardHeader><CardContent><form onSubmit={props.saveRoom} className="space-y-4"><div><Label>Room name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} required /></div><div className="grid grid-cols-2 gap-3"><div><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div><div><Label>Type</Label><Input value={f.type} onChange={(e) => set("type", e.target.value)} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Price</Label><Input type="number" value={f.price} onChange={(e) => set("price", e.target.value)} /></div><div><Label>Original price</Label><Input type="number" value={f.original_price} onChange={(e) => set("original_price", e.target.value)} /></div></div><div className="grid grid-cols-3 gap-3"><div><Label>Capacity</Label><Input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></div><div><Label>Beds</Label><Input type="number" value={f.beds} onChange={(e) => set("beds", e.target.value)} /></div><div><Label>Room sort</Label><Input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Bed type</Label><Input value={f.bed_type} onChange={(e) => set("bed_type", e.target.value)} /></div><div><Label>Size</Label><Input value={f.size} onChange={(e) => set("size", e.target.value)} /></div></div><div><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div><div><Label>Amenities</Label><Textarea value={f.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="One item per line" /></div><div><Label>Highlights</Label><Textarea value={f.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder="One item per line" /></div><div className="rounded-lg border bg-gray-50 p-3"><div className="mb-2"><p className="text-sm font-semibold">Room gallery</p><p className="text-xs text-gray-500">Upload, replace, remove or reorder. Image #1 is the cover used by room cards.</p></div><MediaUploader label="Upload room images / videos" multiple onFiles={addFiles} /><MediaGrid items={f.images} context={f.id ? `Room: ${f.name}` : "New room (unassigned until created)"} onMove={reorder} onRemove={removeImage} onReplace={replaceImage} /></div><div className="flex items-center gap-3"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /><Label>Visible on public site</Label></div><div className="flex gap-2"><Button type="submit"><Save size={16} className="mr-2" />{f.id ? "Save room now" : "Create room"}</Button>{f.id ? <Button type="button" variant="outline" onClick={() => props.setForm(emptyRoomForm)}>Close</Button> : null}</div></form></CardContent></Card><Card className="lg:col-span-3"><CardHeader><CardTitle>Rooms and assigned media</CardTitle><CardDescription>Every thumbnail shown here comes from DB room_media to media_assets.</CardDescription></CardHeader><CardContent><div className="space-y-4">{props.rooms.map((room) => <div key={room.id} className="rounded-lg border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{room.name}</h3><p className="text-sm text-gray-500">{room.price ? new Intl.NumberFormat("vi-VN").format(room.price) : "Contact"} VND - {room.images.length} media</p></div><span className={`rounded-full px-2 py-1 text-xs ${room.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{room.is_active ? "Active" : "Hidden"}</span></div>{room.images.length ? <div className="mt-3 grid grid-cols-4 gap-2">{room.images.slice(0, 8).map((item, index) => <div key={item.asset_id || `${item.url}-${index}`} className="relative h-20 overflow-hidden rounded-md bg-gray-100">{item.type === "video" ? <video src={displayMediaUrl(item)} className="h-full w-full object-cover" muted /> : <img src={displayMediaUrl(item)} alt={item.alt || room.name} className="h-full w-full object-cover" />}<span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">#{index + 1}</span></div>)}</div> : <div className="mt-3 flex h-24 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">No room media assigned</div>}<p className="mt-3 line-clamp-2 text-sm text-gray-600">{room.description}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => props.editRoom(room)}><Edit size={14} className="mr-1" />Manage room & media</Button><Button size="sm" variant="ghost" onClick={() => props.deleteRoom(room.id)}><Trash size={14} className="mr-1" />Delete room</Button></div></div>)}</div></CardContent></Card></div>
}

function LandingBuilder({ landing, setLanding, rooms, save, uploadMedia }: { landing: LandingConfig; setLanding: React.Dispatch<React.SetStateAction<LandingConfig>>; rooms: Room[]; save: () => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const setTop = (group: "brand" | "theme" | "header" | "footer" | "contact" | "roomsPage", key: string, value: any) => setLanding((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))
  const setNavText = (text: string) => setTop("header", "navItems", text.split("\n").filter(Boolean).map((line) => { const [label, path] = line.split("|").map((x) => x.trim()); return { label, path: path || "/" } }))
  const navText = (landing.header.navItems || []).map((item: any) => `${item.label} | ${item.path}`).join("\n")
  const setFiltersText = (text: string) => setTop("roomsPage", "filters", text.split("\n").filter(Boolean).map((line) => { const [label, value] = line.split("|").map((x) => x.trim()); return { label, value: value || "all" } }))
  const filtersText = (landing.roomsPage.filters || []).map((item: any) => `${item.label} | ${item.value}`).join("\n")
  async function uploadLogo(file?: File) { const media = await uploadMedia(file); if (media) setTop("brand", "logo", media) }
  const updateSection = (id: string, patch: Record<string, any>) => setLanding((prev) => ({ ...prev, sections: prev.sections.map((s) => s.id === id ? { ...s, ...patch } : s) }))
  const moveSection = (index: number, to: number) => setLanding((prev) => { if (to < 0 || to >= prev.sections.length) return prev; const arr = [...prev.sections]; const [item] = arr.splice(index, 1); arr.splice(to, 0, item); return { ...prev, sections: arr.map((s, i) => ({ ...s, sort_order: i + 1 })) } })
  const removeSection = (id: string) => setLanding((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, sort_order: i + 1 })) }))
  const addSection = (type: LandingSectionType) => setLanding((prev) => ({ ...prev, sections: [...prev.sections, createSection(type, prev.sections.length + 1)] }))

  return <div className="space-y-5">
    <Card>
      <CardHeader><CardTitle>Thông tin chung</CardTitle><CardDescription>Mọi thay đổi ở Landing Builder được tự lưu vào DB sau khoảng 0.7 giây.</CardDescription></CardHeader>
      <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <h3 className="font-semibold">Brand</h3>
          <Field label="Tên homestay"><Input value={landing.brand.name || ""} onChange={(e) => setTop("brand", "name", e.target.value)} /></Field>
          <Field label="Logo text"><Input value={landing.brand.logoText || ""} onChange={(e) => setTop("brand", "logoText", e.target.value)} /></Field>
          <Field label="Điện thoại"><Input value={landing.brand.phone || ""} onChange={(e) => setTop("brand", "phone", e.target.value)} /></Field>
          <Field label="Email"><Input value={landing.brand.email || ""} onChange={(e) => setTop("brand", "email", e.target.value)} /></Field>
          <Field label="Địa chỉ"><Textarea value={landing.brand.address || ""} onChange={(e) => setTop("brand", "address", e.target.value)} /></Field>
          <Field label="Facebook URL"><Input value={landing.brand.facebookUrl || ""} onChange={(e) => setTop("brand", "facebookUrl", e.target.value)} /></Field>
          <Field label="Instagram URL"><Input value={landing.brand.instagramUrl || ""} onChange={(e) => setTop("brand", "instagramUrl", e.target.value)} /></Field>
          <MediaUploader label="Upload logo" onFiles={(files) => uploadLogo(files?.[0])} />
          {landing.brand.logo ? <MediaGrid items={[landing.brand.logo]} onRemove={() => setTop("brand", "logo", null)} onReplace={async (_, file) => uploadLogo(file)} /> : null}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Giao diện</h3>
          <Field label="Font nội dung"><Input value={landing.theme.fontFamily || ""} onChange={(e) => setTop("theme", "fontFamily", e.target.value)} /></Field>
          <Field label="Font tiêu đề"><Input value={landing.theme.headingFont || ""} onChange={(e) => setTop("theme", "headingFont", e.target.value)} /></Field>
          <Field label="Màu chính"><div className="flex gap-2"><Input type="color" className="w-16" value={landing.theme.primaryColor || "#111111"} onChange={(e) => setTop("theme", "primaryColor", e.target.value)} /><Input value={landing.theme.primaryColor || ""} onChange={(e) => setTop("theme", "primaryColor", e.target.value)} /></div></Field>
          <Field label="Màu nền"><div className="flex gap-2"><Input type="color" className="w-16" value={landing.theme.backgroundColor || "#f7f5f2"} onChange={(e) => setTop("theme", "backgroundColor", e.target.value)} /><Input value={landing.theme.backgroundColor || ""} onChange={(e) => setTop("theme", "backgroundColor", e.target.value)} /></div></Field>
          <Field label="Google Maps embed link"><Textarea value={landing.footer.mapEmbedUrl || ""} onChange={(e) => setTop("footer", "mapEmbedUrl", e.target.value)} /></Field>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Header / Footer</h3>
          <Field label="Menu: Label | /duong-dan"><Textarea value={navText} onChange={(e) => setNavText(e.target.value)} /></Field>
          <Field label="Nút header"><Input value={landing.header.ctaText || ""} onChange={(e) => setTop("header", "ctaText", e.target.value)} /></Field>
          <Field label="Link nút header"><Input value={landing.header.ctaLink || ""} onChange={(e) => setTop("header", "ctaLink", e.target.value)} /></Field>
          <Field label="Tiêu đề Quick links"><Input value={landing.footer.quickLinksTitle || ""} onChange={(e) => setTop("footer", "quickLinksTitle", e.target.value)} /></Field>
          <Field label="Tiêu đề Contact"><Input value={landing.footer.contactTitle || ""} onChange={(e) => setTop("footer", "contactTitle", e.target.value)} /></Field>
          <Field label="Tiêu đề Social"><Input value={landing.footer.socialTitle || ""} onChange={(e) => setTop("footer", "socialTitle", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={landing.footer.showCta !== false} onChange={(e) => setTop("footer", "showCta", e.target.checked)} /> Hiện CTA ở footer</label>
          <Field label="Copyright"><Input value={landing.footer.copyrightText || ""} onChange={(e) => setTop("footer", "copyrightText", e.target.value)} /></Field>
          <Field label="Text dưới cùng"><Input value={landing.footer.bottomText || ""} onChange={(e) => setTop("footer", "bottomText", e.target.value)} /></Field>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Trang Rooms & Contact</CardTitle><CardDescription>Nội dung page phụ cũng nằm trong cùng JSON DB, không hard-code ở public FE.</CardDescription></CardHeader>
      <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold">Rooms page</h3>
          <Field label="Eyebrow"><Input value={landing.roomsPage.eyebrow || ""} onChange={(e) => setTop("roomsPage", "eyebrow", e.target.value)} /></Field>
          <Field label="Tiêu đề"><Input value={landing.roomsPage.title || ""} onChange={(e) => setTop("roomsPage", "title", e.target.value)} /></Field>
          <Field label="Mô tả"><Textarea value={landing.roomsPage.description || ""} onChange={(e) => setTop("roomsPage", "description", e.target.value)} /></Field>
          <Field label="Bộ lọc: Label | value"><Textarea value={filtersText} onChange={(e) => setFiltersText(e.target.value)} /></Field>
          <Field label="Text khi chưa có ảnh"><Input value={landing.roomsPage.emptyImageText || ""} onChange={(e) => setTop("roomsPage", "emptyImageText", e.target.value)} /></Field>
          <Field label="Amenities title"><Input value={landing.roomsPage.amenitiesTitle || ""} onChange={(e) => setTop("roomsPage", "amenitiesTitle", e.target.value)} /></Field>
          <Field label="Nút booking"><Input value={landing.roomsPage.bookingButtonText || ""} onChange={(e) => setTop("roomsPage", "bookingButtonText", e.target.value)} /></Field>
          <Field label="Ghi chú booking"><Textarea value={landing.roomsPage.bookingNote || ""} onChange={(e) => setTop("roomsPage", "bookingNote", e.target.value)} /></Field>
          <Field label="Text booking-only"><Input value={landing.roomsPage.bookingOnlyText || ""} onChange={(e) => setTop("roomsPage", "bookingOnlyText", e.target.value)} /></Field>
          <Field label="Giá khi cần liên hệ"><Input value={landing.roomsPage.contactPriceText || ""} onChange={(e) => setTop("roomsPage", "contactPriceText", e.target.value)} /></Field>
          <Field label="Hậu tố giá"><Input value={landing.roomsPage.priceSuffix || ""} onChange={(e) => setTop("roomsPage", "priceSuffix", e.target.value)} /></Field>
          <Field label="Hậu tố số khách"><Input value={landing.roomsPage.guestsSuffix || ""} onChange={(e) => setTop("roomsPage", "guestsSuffix", e.target.value)} /></Field>
          <Field label="Text giường mặc định"><Input value={landing.roomsPage.bedFallback || ""} onChange={(e) => setTop("roomsPage", "bedFallback", e.target.value)} /></Field>
          <Field label="Text khi không có phòng"><Input value={landing.roomsPage.noRoomsText || ""} onChange={(e) => setTop("roomsPage", "noRoomsText", e.target.value)} /></Field>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Contact page</h3>
          <Field label="Eyebrow"><Input value={landing.contact.eyebrow || ""} onChange={(e) => setTop("contact", "eyebrow", e.target.value)} /></Field>
          <Field label="Tiêu đề"><Input value={landing.contact.title || ""} onChange={(e) => setTop("contact", "title", e.target.value)} /></Field>
          <Field label="Mô tả"><Textarea value={landing.contact.description || ""} onChange={(e) => setTop("contact", "description", e.target.value)} /></Field>
          <Field label="Tiêu đề thông tin"><Input value={landing.contact.infoTitle || ""} onChange={(e) => setTop("contact", "infoTitle", e.target.value)} /></Field>
          <Field label="Mô tả thông tin"><Textarea value={landing.contact.infoDescription || ""} onChange={(e) => setTop("contact", "infoDescription", e.target.value)} /></Field>
          <Field label="Tiêu đề thành công"><Input value={landing.contact.successTitle || ""} onChange={(e) => setTop("contact", "successTitle", e.target.value)} /></Field>
          <Field label="Nội dung thành công"><Textarea value={landing.contact.successMessage || ""} onChange={(e) => setTop("contact", "successMessage", e.target.value)} /></Field>
          <Field label="Label địa chỉ"><Input value={landing.contact.addressLabel || ""} onChange={(e) => setTop("contact", "addressLabel", e.target.value)} /></Field>
          <Field label="Label điện thoại"><Input value={landing.contact.phoneLabel || ""} onChange={(e) => setTop("contact", "phoneLabel", e.target.value)} /></Field>
          <Field label="Label email"><Input value={landing.contact.emailLabel || ""} onChange={(e) => setTop("contact", "emailLabel", e.target.value)} /></Field>
          <Field label="Text nút gửi"><Input value={landing.contact.submitText || ""} onChange={(e) => setTop("contact", "submitText", e.target.value)} /></Field>
          <Field label="Text khi đang gửi"><Input value={landing.contact.submittingText || ""} onChange={(e) => setTop("contact", "submittingText", e.target.value)} /></Field>
          <Field label="Ghi chú dưới nút gửi"><Textarea value={landing.contact.submitNote || ""} onChange={(e) => setTop("contact", "submitNote", e.target.value)} /></Field>
          <Field label="Nút gửi yêu cầu khác"><Input value={landing.contact.sendAnotherText || ""} onChange={(e) => setTop("contact", "sendAnotherText", e.target.value)} /></Field>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><CardTitle>Sections landing page</CardTitle><CardDescription>Upload, thay, xóa, đổi thứ tự đều tự lưu vào DB.</CardDescription></div><div className="flex flex-wrap gap-2"><AddSectionButton add={addSection} /><Button onClick={save}><Save size={16} className="mr-2" />Lưu ngay</Button></div></div></CardHeader>
      <CardContent className="space-y-4">
        {landing.sections.map((section, index) => <SectionEditor key={section.id} section={section} index={index} total={landing.sections.length} rooms={rooms} update={(patch) => updateSection(section.id, patch)} remove={() => removeSection(section.id)} moveUp={() => moveSection(index, index - 1)} moveDown={() => moveSection(index, index + 1)} uploadMedia={uploadMedia} />)}
      </CardContent>
    </Card>
  </div>
}

function createSection(type: LandingSectionType, sortOrder: number): LandingSection {
  const base = { id: uid(type), type, enabled: true, sort_order: sortOrder, title: "" }
  if (type === "hero") return { ...base, subtitle: "", primaryButtonText: "", primaryButtonLink: "/rooms", secondaryButtonText: "", secondaryButtonLink: "/contact", image: null, video: null }
  if (type === "rooms") return { ...base, description: "", buttonText: "", buttonLink: "/rooms", limit: 3, roomIds: [] }
  if (type === "welcome") return { ...base, eyebrow: "", paragraphs: [], images: [] }
  if (type === "experiences") return { ...base, description: "", items: [] }
  if (type === "amenities") return { ...base, items: [] }
  if (type === "testimonials") return { ...base, items: [] }
  if (type === "gallery") return { ...base, images: [] }
  if (type === "banner") return { ...base, description: "", buttonText: "", buttonLink: "/contact", image: null }
  return { ...base, description: "", buttonText: "", buttonLink: "/contact" }
}

function sectionLabel(type: LandingSectionType) {
  return ({ hero: "Hero / Banner đầu trang", welcome: "Giới thiệu", experiences: "Trải nghiệm", rooms: "Show phòng", amenities: "Tiện ích", testimonials: "Đánh giá", gallery: "Thư viện ảnh", banner: "Banner", cta: "CTA đặt phòng" } as Record<LandingSectionType, string>)[type]
}

function AddSectionButton({ add }: { add: (type: LandingSectionType) => void }) {
  const [type, setType] = useState<LandingSectionType>("banner")
  return <div className="flex gap-2"><select className="rounded-md border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as LandingSectionType)}>{(["hero", "banner", "welcome", "rooms", "experiences", "amenities", "gallery", "testimonials", "cta"] as LandingSectionType[]).map((t) => <option key={t} value={t}>{sectionLabel(t)}</option>)}</select><Button variant="outline" onClick={() => add(type)}><Plus size={16} className="mr-1" />Thêm</Button></div>
}

function SectionEditor(props: { section: LandingSection; index: number; total: number; rooms: Room[]; update: (patch: Record<string, any>) => void; remove: () => void; moveUp: () => void; moveDown: () => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const s = props.section
  async function uploadTo(key: string, file?: File) {
    const media = await props.uploadMedia(file)
    if (!media) return
    // If admin chooses a hero image, make it the visible hero instead of leaving an old video above it.
    if (s.type === "hero" && key === "image") props.update({ image: media, video: null })
    else props.update({ [key]: media })
  }
  async function addToImages(files?: FileList | null) {
    if (!files) return
    const current = normalizeMediaList(s.images)
    const uploaded: MediaItem[] = []
    for (const file of Array.from(files)) { const media = await props.uploadMedia(file); if (media) uploaded.push(media) }
    // Put new uploads first because public cards/welcome sections intentionally render the first media items.
    props.update({ images: [...uploaded, ...current].map((item, index) => ({ ...item, sort_order: index })) })
  }
  const setItems = (items: any[]) => props.update({ items })
  const setImages = (items: MediaItem[]) => props.update({ images: items })
  async function replaceImage(index: number, file?: File) {
    const media = await props.uploadMedia(file)
    if (!media) return
    setImages(normalizeMediaList(s.images).map((item, i) => i === index ? { ...media, sort_order: index } : item))
  }
  return <div className="rounded-xl border bg-white p-4"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">#{props.index + 1}</span><div><h3 className="font-semibold">{sectionLabel(s.type)}</h3><p className="text-xs text-gray-500">{s.id}</p></div></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={props.index === 0} onClick={props.moveUp}><ArrowUp size={14} /></Button><Button size="sm" variant="outline" disabled={props.index === props.total - 1} onClick={props.moveDown}><ArrowDown size={14} /></Button><Button size="sm" variant={s.enabled === false ? "outline" : "default"} onClick={() => props.update({ enabled: s.enabled === false })}>{s.enabled === false ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}{s.enabled === false ? "Đang ẩn" : "Đang hiện"}</Button><Button size="sm" variant="ghost" onClick={props.remove}><Trash size={14} /></Button></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Field label="Tiêu đề"><Input value={s.title || ""} onChange={(e) => props.update({ title: e.target.value })} /></Field>{s.type !== "hero" && <Field label="Mô tả"><Textarea value={s.description || ""} onChange={(e) => props.update({ description: e.target.value })} /></Field>}{s.type === "hero" && <><Field label="Subtitle"><Textarea value={s.subtitle || ""} onChange={(e) => props.update({ subtitle: e.target.value })} /></Field><Field label="Nút chính"><Input value={s.primaryButtonText || ""} onChange={(e) => props.update({ primaryButtonText: e.target.value })} /></Field><Field label="Link nút chính"><Input value={s.primaryButtonLink || ""} onChange={(e) => props.update({ primaryButtonLink: e.target.value })} /></Field><Field label="Nút phụ"><Input value={s.secondaryButtonText || ""} onChange={(e) => props.update({ secondaryButtonText: e.target.value })} /></Field><Field label="Link nút phụ"><Input value={s.secondaryButtonLink || ""} onChange={(e) => props.update({ secondaryButtonLink: e.target.value })} /></Field><MediaUploader label="Upload video hero" accept="video/*" icon="video" onFiles={(files) => uploadTo("video", files?.[0])} /><MediaUploader label="Upload ảnh hero fallback" onFiles={(files) => uploadTo("image", files?.[0])} />{s.video ? <div className="md:col-span-2"><Label>Video hero hiện tại</Label><MediaGrid items={[s.video]} onRemove={() => props.update({ video: null })} onReplace={async (_, file) => uploadTo("video", file)} /></div> : null}{s.image ? <div className="md:col-span-2"><Label>Ảnh hero fallback hiện tại</Label><MediaGrid items={[s.image]} onRemove={() => props.update({ image: null })} onReplace={async (_, file) => uploadTo("image", file)} /></div> : null}</>}{s.type === "banner" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || ""} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field><MediaUploader label="Upload ảnh banner" onFiles={(files) => uploadTo("image", files?.[0])} />{s.image ? <div className="md:col-span-2"><Label>Ảnh banner hiện tại</Label><MediaGrid items={[s.image]} onRemove={() => props.update({ image: null })} onReplace={async (_, file) => uploadTo("image", file)} /></div> : null}</>}{s.type === "welcome" && <><Field label="Eyebrow"><Input value={s.eyebrow || ""} onChange={(e) => props.update({ eyebrow: e.target.value })} /></Field><Field label="Đoạn văn, mỗi dòng 1 đoạn"><Textarea value={(s.paragraphs || []).join("\n")} onChange={(e) => props.update({ paragraphs: e.target.value.split("\n").filter(Boolean) })} /></Field><div className="md:col-span-2"><MediaUploader label="Upload ảnh giới thiệu" multiple onFiles={addToImages} /><MediaGrid items={normalizeMediaList(s.images)} onMove={(from, to) => reorderMedia(normalizeMediaList(s.images), from, to, setImages)} onRemove={(index) => removeMedia(normalizeMediaList(s.images), index, setImages)} onReplace={replaceImage} /></div></>}{s.type === "rooms" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || "/rooms"} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field><Field label="Số phòng tối đa"><Input type="number" min="1" value={s.limit || 3} onChange={(e) => props.update({ limit: Number(e.target.value) })} /></Field><div className="md:col-span-2"><Label className="mb-2 block">Chọn phòng muốn show, bỏ trống = show theo sort trong DB</Label><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{props.rooms.map((room) => <label key={room.id} className="flex items-center gap-2 rounded-md border p-2 text-sm"><input type="checkbox" checked={(s.roomIds || []).includes(room.id)} onChange={(e) => { const ids = new Set(s.roomIds || []); e.target.checked ? ids.add(room.id) : ids.delete(room.id); props.update({ roomIds: Array.from(ids) }) }} />{room.name}</label>)}</div></div></>}{s.type === "experiences" && <ItemsEditor type="experiences" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "amenities" && <ItemsEditor type="amenities" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "testimonials" && <ItemsEditor type="testimonials" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "gallery" && <div className="md:col-span-2"><MediaUploader label="Upload ảnh gallery" multiple onFiles={addToImages} /><MediaGrid items={normalizeMediaList(s.images)} onMove={(from, to) => reorderMedia(normalizeMediaList(s.images), from, to, setImages)} onRemove={(index) => removeMedia(normalizeMediaList(s.images), index, setImages)} onReplace={replaceImage} /></div>}{s.type === "cta" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || "/contact"} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field></>}</div></div>
}

function ItemsEditor({ type, items, setItems, uploadMedia }: { type: "experiences" | "amenities" | "testimonials"; items: any[]; setItems: (items: any[]) => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const add = () => setItems([...items, type === "testimonials" ? { name: "", country: "", rating: 5, text: "" } : { title: "", description: "", image: null }])
  const patch = (index: number, key: string, value: any) => setItems(items.map((item, i) => i === index ? { ...item, [key]: value } : item))
  const remove = (index: number) => setItems(items.filter((_, i) => i !== index))
  return <div className="md:col-span-2 space-y-3"><div className="flex items-center justify-between"><Label>Danh sách item</Label><Button type="button" size="sm" variant="outline" onClick={add}><Plus size={14} className="mr-1" />Thêm item</Button></div>{items.map((item, index) => <div key={index} className="rounded-lg border p-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{type === "testimonials" ? <><Field label="Tên khách"><Input value={item.name || ""} onChange={(e) => patch(index, "name", e.target.value)} /></Field><Field label="Quốc gia"><Input value={item.country || ""} onChange={(e) => patch(index, "country", e.target.value)} /></Field><Field label="Số sao"><Input type="number" min="1" max="5" value={item.rating || 5} onChange={(e) => patch(index, "rating", Number(e.target.value))} /></Field><Field label="Review"><Textarea value={item.text || ""} onChange={(e) => patch(index, "text", e.target.value)} /></Field></> : <><Field label="Tiêu đề"><Input value={item.title || ""} onChange={(e) => patch(index, "title", e.target.value)} /></Field><Field label="Mô tả"><Textarea value={item.description || ""} onChange={(e) => patch(index, "description", e.target.value)} /></Field>{type === "experiences" ? <div className="md:col-span-2"><MediaUploader label="Ảnh item" onFiles={async (files) => { const media = await uploadMedia(files?.[0]); if (media) patch(index, "image", media) }} />{item.image ? <MediaGrid items={normalizeMediaList([item.image])} onRemove={() => patch(index, "image", null)} onReplace={async (_, file) => { const media = await uploadMedia(file); if (media) patch(index, "image", media) }} /> : null}</div> : null}</>}<div><Button type="button" size="sm" variant="ghost" onClick={() => remove(index)}><Trash size={14} className="mr-1" />Xoá item</Button></div></div></div>)}</div>
}

function reorderMedia(items: MediaItem[], from: number, to: number, setItems?: (items: MediaItem[]) => void) { if (!setItems || to < 0 || to >= items.length) return; const arr = [...items]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved); setItems(arr.map((item, index) => ({ ...item, sort_order: index }))) }
function removeMedia(items: MediaItem[], index: number, setItems?: (items: MediaItem[]) => void) { if (!setItems) return; setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i }))) }
function MediaUploader({ label, accept = "image/*,video/*", multiple, onFiles, icon = "image" }: { label: string; accept?: string; multiple?: boolean; onFiles: (files?: FileList | null) => void; icon?: "image" | "video" }) { return <div className="rounded-md border border-dashed p-3"><Label className="mb-2 flex items-center gap-2">{icon === "video" ? <Video size={16} /> : <ImageUp size={16} />}{label}</Label><Input type="file" accept={accept} multiple={multiple} onChange={(e) => onFiles(e.target.files)} /><p className="mt-1 text-xs text-gray-500">Ảnh sẽ resize/đổi sang WebP, video đổi sang MP4 rồi lưu vào data/uploads trên máy host.</p></div> }
function MediaGrid({ items, onMove, onRemove, onReplace, context }: { items: MediaItem[]; onMove?: (from: number, to: number) => void; onRemove?: (index: number) => void; onReplace?: (index: number, file?: File) => void | Promise<void>; context?: string }) {
  if (!items.length) return <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">No media assigned.</p>
  return <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{items.map((item, index) => <div key={item.asset_id || `${item.url}-${index}`} className="rounded-lg border bg-white p-2"><div className="relative h-28 overflow-hidden rounded-md bg-gray-100">{item.type === "video" ? <video src={displayMediaUrl(item)} className="h-full w-full object-cover" muted /> : <img src={displayMediaUrl(item)} alt={item.alt || item.original_filename || "media"} className="h-full w-full object-cover" />}<span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">#{index + 1}</span></div><div className="mt-2 space-y-0.5"><p className="truncate text-xs font-medium" title={item.original_filename || item.storage_path || item.url}>{item.original_filename || item.storage_path || "Media"}</p>{context ? <p className="truncate text-[10px] text-blue-600" title={context}>{context}</p> : null}<p className="truncate text-[10px] text-gray-500" title={item.storage_path || item.url}>{item.storage_path || item.url}</p>{item.asset_id ? <p className="truncate text-[9px] text-gray-400" title={item.asset_id}>DB: {item.asset_id}</p> : <p className="text-[9px] text-amber-600">No DB asset id</p>}</div><div className="mt-2 flex flex-wrap justify-between gap-1"><Button type="button" size="sm" variant="outline" disabled={!onMove || index === 0} onClick={() => onMove?.(index, index - 1)}><ArrowUp size={12} /></Button><Button type="button" size="sm" variant="outline" disabled={!onMove || index === items.length - 1} onClick={() => onMove?.(index, index + 1)}><ArrowDown size={12} /></Button>{onReplace ? <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-xs hover:bg-accent hover:text-accent-foreground"><Edit size={12} className="mr-1" />Replace<input type="file" accept={item.type === "video" ? "video/*" : "image/*"} className="hidden" onChange={(e) => { void onReplace(index, e.target.files?.[0]); e.currentTarget.value = "" }} /></label> : null}{onRemove ? <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(index)}><Trash size={12} /></Button> : null}</div></div>)}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1"><span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>{children}</label> }
