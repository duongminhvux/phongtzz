"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, CalendarDays, Edit, Eye, EyeOff, Home, ImageUp, LayoutDashboard, LogOut, MessageSquare, Plus, Save, Search, Trash, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

type BookingStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CANCELLED"
type MediaItem = { url: string; type?: "image" | "video"; public_id?: string | null; width?: number | null; height?: number | null; format?: string | null; alt?: string | null; sort_order?: number }
type LandingSectionType = "hero" | "welcome" | "experiences" | "rooms" | "amenities" | "testimonials" | "gallery" | "banner" | "cta"
type LandingSection = Record<string, any> & { id: string; type: LandingSectionType; enabled?: boolean; sort_order?: number }
type LandingConfig = Record<string, any> & { brand: Record<string, any>; theme: Record<string, any>; header: Record<string, any>; footer: Record<string, any>; contact: Record<string, any>; sections: LandingSection[] }

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

type Section = "dashboard" | "bookings" | "rooms" | "landing"

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
  brand: { name: "phongtzzz", logoText: "phongtzzz", phone: "", email: "", address: "", facebookUrl: "", instagramUrl: "", logo: null },
  theme: { fontFamily: "Inter, Arial, sans-serif", headingFont: "Georgia, serif", primaryColor: "#111111", backgroundColor: "#f7f5f2" },
  header: { ctaText: "Book Now", ctaLink: "/contact", navItems: [{ label: "Home", path: "/" }, { label: "Rooms", path: "/rooms" }, { label: "Booking Request", path: "/contact" }] },
  footer: { showCta: true, bottomText: "Booking request website", quickLinksTitle: "Quick links", contactTitle: "Contact Us", socialTitle: "Follow Us", copyrightText: "Copyright 2026 © phongtzzz Homestay. All rights reserved." },
  contact: { title: "Send a booking request", description: "Tell us your travel dates.", successTitle: "Request sent!", successMessage: "Thank you. Our homestay will contact you soon." },
  sections: [],
}

function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("phong_admin_token") || ""
}
function saveToken(token: string) { localStorage.setItem("phong_admin_token", token) }
function clearToken() { localStorage.removeItem("phong_admin_token") }
function splitList(value: string) { return value.split("\n").flatMap((line) => line.split(",")).map((item) => item.trim()).filter(Boolean) }
function joinList(value?: string[]) { return (value || []).join("\n") }
function formatDate(value?: string | null) { if (!value) return "-"; return new Intl.DateTimeFormat("vi-VN").format(new Date(value)) }
function mediaUrl(item?: MediaItem | string | null) { return typeof item === "string" ? item : item?.url || "" }
function normalizeMediaList(value: any): MediaItem[] {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => typeof item === "string" ? { url: item, type: item.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image", sort_order: index } : { ...item, sort_order: item?.sort_order ?? index })
    .filter((item) => item.url)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}
function normalizeRoom(room: Room): Room { return { ...room, images: normalizeMediaList(room.images) } }
function uid(prefix = "section") { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}` }

function oldLandingToSections(value: any): LandingSection[] {
  if (Array.isArray(value.sections) && value.sections.length) return value.sections
  const sections: LandingSection[] = []
  const hero = value.hero || {}
  sections.push({ id: "hero-main", type: "hero", enabled: true, sort_order: 1, title: hero.title, subtitle: hero.subtitle, primaryButtonText: hero.primaryButtonText, primaryButtonLink: hero.primaryButtonLink, secondaryButtonText: hero.secondaryButtonText, secondaryButtonLink: hero.secondaryButtonLink, video: hero.videoUrl ? { url: hero.videoUrl, type: "video" } : null, image: hero.imageUrl ? { url: hero.imageUrl, type: "image" } : null })
  if (value.welcome) sections.push({ id: "welcome-main", type: "welcome", enabled: true, sort_order: 2, ...value.welcome, images: normalizeMediaList(value.welcome.images) })
  if (value.experiences) sections.push({ id: "experiences-main", type: "experiences", enabled: true, sort_order: 3, ...value.experiences, items: (value.experiences.items || []).map((item: any) => ({ ...item, image: item.image ? (typeof item.image === "string" ? { url: item.image, type: "image" } : item.image) : null })) })
  if (value.roomsPreview) sections.push({ id: "rooms-main", type: "rooms", enabled: true, sort_order: 4, ...value.roomsPreview, buttonLink: "/rooms", limit: 3, roomIds: [] })
  if (value.amenities) sections.push({ id: "amenities-main", type: "amenities", enabled: true, sort_order: 5, ...value.amenities })
  if (value.testimonials) sections.push({ id: "testimonials-main", type: "testimonials", enabled: true, sort_order: 6, ...value.testimonials })
  if (value.gallery) sections.push({ id: "gallery-main", type: "gallery", enabled: true, sort_order: 7, ...value.gallery, images: normalizeMediaList(value.gallery.images) })
  if (value.cta) sections.push({ id: "cta-main", type: "cta", enabled: true, sort_order: 8, ...value.cta })
  return sections
}

function normalizeLanding(value: any): LandingConfig {
  const merged = { ...emptyLanding, ...(value || {}) }
  return {
    ...merged,
    brand: { ...emptyLanding.brand, ...(merged.brand || {}) },
    theme: { ...emptyLanding.theme, ...(merged.theme || {}) },
    header: { ...emptyLanding.header, ...(merged.header || {}) },
    footer: { ...emptyLanding.footer, ...(merged.footer || {}) },
    contact: { ...emptyLanding.contact, ...(merged.contact || {}) },
    sections: oldLandingToSections(merged).map((section, index) => ({ ...section, id: section.id || uid(section.type), enabled: section.enabled !== false, sort_order: section.sort_order ?? index })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
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
  const [email, setEmail] = useState("admin@phongtzzz.local")
  const [password, setPassword] = useState("admin123456")
  const [section, setSection] = useState<Section>("dashboard")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [landing, setLanding] = useState<LandingConfig>(emptyLanding)
  const [bookingQuery, setBookingQuery] = useState("")
  const [bookingStatus, setBookingStatus] = useState("")
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm)

  const stats = useMemo(() => ({
    totalBookings: bookings.length,
    newBookings: bookings.filter((item) => item.status === "NEW").length,
    contacted: bookings.filter((item) => item.status === "CONTACTED").length,
    rooms: rooms.length,
  }), [bookings, rooms])

  const authHeaders = () => ({ Authorization: `Bearer ${token || getToken()}` })
  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
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
      const [bookingData, roomData, landingData] = await Promise.all([
        api<BookingRequest[]>("/admin/booking-requests"),
        api<Room[]>("/admin/rooms"),
        api<{ value: Record<string, unknown> }>("/admin/landing-page"),
      ])
      setBookings(bookingData)
      setRooms(roomData.map(normalizeRoom))
      setLanding(normalizeLanding(landingData.value))
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

  function editRoom(room: Room) {
    setRoomForm({ id: room.id, name: room.name, slug: room.slug, type: room.type, price: room.price?.toString() || "", original_price: room.original_price?.toString() || "", capacity: room.capacity?.toString() || "", beds: room.beds?.toString() || "", bed_type: room.bed_type || "", size: room.size || "", description: room.description || "", amenities: joinList(room.amenities), highlights: joinList(room.highlights), images: normalizeMediaList(room.images), is_active: room.is_active, sort_order: room.sort_order?.toString() || "0" })
    setSection("rooms")
  }
  async function saveRoom(event: React.FormEvent) {
    event.preventDefault()
    const payload = { name: roomForm.name, slug: roomForm.slug || undefined, type: roomForm.type || "private", price: roomForm.price ? Number(roomForm.price) : null, original_price: roomForm.original_price ? Number(roomForm.original_price) : null, capacity: roomForm.capacity ? Number(roomForm.capacity) : null, beds: roomForm.beds ? Number(roomForm.beds) : null, bed_type: roomForm.bed_type || null, size: roomForm.size || null, description: roomForm.description || null, amenities: splitList(roomForm.amenities), highlights: splitList(roomForm.highlights), images: roomForm.images.map((item, index) => ({ ...item, sort_order: index })), is_active: roomForm.is_active, sort_order: Number(roomForm.sort_order || 0) }
    const path = roomForm.id ? `/admin/rooms/${roomForm.id}` : "/admin/rooms"; const method = roomForm.id ? "PATCH" : "POST"
    await api(path, { method, body: JSON.stringify(payload) })
    setRoomForm(emptyRoomForm); setMessage("Đã lưu phòng"); setRooms((await api<Room[]>("/admin/rooms")).map(normalizeRoom))
  }
  async function deleteRoom(id: string) { if (!confirm("Xoá phòng này?")) return; await api(`/admin/rooms/${id}`, { method: "DELETE" }); setRooms((await api<Room[]>("/admin/rooms")).map(normalizeRoom)) }

  async function uploadMedia(file?: File): Promise<MediaItem | null> {
    if (!file) return null
    const formData = new FormData(); formData.append("file", file)
    try { const data = await api<MediaItem>("/admin/uploads/media", { method: "POST", body: formData }); setMessage(`Upload xong: ${data.format || data.type}`); return data }
    catch (err) { setError(err instanceof Error ? err.message : "Upload lỗi"); return null }
  }

  async function saveLanding() {
    try { await api("/admin/landing-page", { method: "PATCH", body: JSON.stringify({ value: serializeLanding(landing) }) }); setMessage("Đã lưu landing page") }
    catch (err) { setError(err instanceof Error ? err.message : "Không lưu được landing") }
  }

  if (!token) return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Phongtzzz Admin</CardTitle><CardDescription>Đăng nhập để quản lý booking request, phòng và landing page.</CardDescription></CardHeader><CardContent>
        <form onSubmit={handleLogin} className="space-y-4"><div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<Button className="w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Login"}</Button></form>
      </CardContent></Card>
    </main>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 border-r bg-white md:block"><div className="border-b p-6"><h1 className="text-2xl font-semibold text-purple-600">Phongtzzz</h1><p className="mt-1 text-sm text-gray-500">Booking Request Admin</p></div><nav className="space-y-1 p-3"><NavButton active={section === "dashboard"} onClick={() => setSection("dashboard")} icon={<LayoutDashboard size={18} />} label="Dashboard" /><NavButton active={section === "bookings"} onClick={() => setSection("bookings")} icon={<MessageSquare size={18} />} label="Booking Requests" /><NavButton active={section === "rooms"} onClick={() => setSection("rooms")} icon={<Home size={18} />} label="Rooms" /><NavButton active={section === "landing"} onClick={() => setSection("landing")} icon={<Edit size={18} />} label="Landing Builder" /></nav></aside>
      <main className="flex-1"><header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8"><div><h2 className="text-xl font-semibold">{sectionTitle(section)}</h2><p className="text-sm text-gray-500">Landing dùng dữ liệu trong DB, admin quyết định hiển thị gì.</p></div><div className="flex items-center gap-2"><Button variant="outline" onClick={loadAll} disabled={loading}>Refresh</Button><Button variant="ghost" onClick={logout}><LogOut size={16} className="mr-2" />Logout</Button></div></header>
        <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">{message ? <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}{error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {section === "dashboard" ? <DashboardSection stats={stats} bookings={bookings.slice(0, 5)} /> : null}
          {section === "bookings" ? <BookingsSection bookings={bookings} query={bookingQuery} status={bookingStatus} setQuery={setBookingQuery} setStatus={setBookingStatus} refresh={refreshBookings} updateBooking={updateBooking} deleteBooking={deleteBooking} /> : null}
          {section === "rooms" ? <RoomsSection rooms={rooms} form={roomForm} setForm={setRoomForm} saveRoom={saveRoom} editRoom={editRoom} deleteRoom={deleteRoom} uploadMedia={uploadMedia} /> : null}
          {section === "landing" ? <LandingBuilder landing={landing} setLanding={setLanding} rooms={rooms} save={saveLanding} uploadMedia={uploadMedia} /> : null}
        </div>
      </main>
    </div>
  )
}

function sectionTitle(section: Section) { return section === "dashboard" ? "Dashboard" : section === "bookings" ? "Booking Requests" : section === "rooms" ? "Rooms" : "Landing Page Builder" }
function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>{icon}{label}</button> }
function DashboardSection({ stats, bookings }: { stats: any; bookings: BookingRequest[] }) { return <><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><StatCard title="Total Requests" value={stats.totalBookings} icon={<MessageSquare />} /><StatCard title="New" value={stats.newBookings} icon={<CalendarDays />} /><StatCard title="Contacted" value={stats.contacted} icon={<Search />} /><StatCard title="Rooms" value={stats.rooms} icon={<Home />} /></div><Card><CardHeader><CardTitle>Latest booking requests</CardTitle></CardHeader><CardContent><BookingTable bookings={bookings} /></CardContent></Card></> }
function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold">{value}</p></div><div className="rounded-full bg-blue-50 p-3 text-blue-600">{icon}</div></CardContent></Card> }

function BookingsSection(props: { bookings: BookingRequest[]; query: string; status: string; setQuery: (v: string) => void; setStatus: (v: string) => void; refresh: () => void; updateBooking: (id: string, payload: Partial<Pick<BookingRequest, "status" | "internal_note">>) => void; deleteBooking: (id: string) => void }) { return <Card><CardHeader><CardTitle>Booking Requests</CardTitle><CardDescription>Quản lý khách gửi yêu cầu đặt phòng. Không check phòng trống tự động.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 md:flex-row"><Input placeholder="Tìm tên / SĐT / email" value={props.query} onChange={(e) => props.setQuery(e.target.value)} /><select className="rounded-md border px-3 py-2 text-sm" value={props.status} onChange={(e) => props.setStatus(e.target.value)}><option value="">All status</option><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option></select><Button onClick={props.refresh}><Search size={16} className="mr-2" />Filter</Button></div><BookingTable bookings={props.bookings} updateBooking={props.updateBooking} deleteBooking={props.deleteBooking} editable /></CardContent></Card> }
function BookingTable({ bookings, editable, updateBooking, deleteBooking }: { bookings: BookingRequest[]; editable?: boolean; updateBooking?: any; deleteBooking?: any }) { return <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Khách</TableHead><TableHead>Ngày</TableHead><TableHead>Phòng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ghi chú</TableHead>{editable ? <TableHead>Action</TableHead> : null}</TableRow></TableHeader><TableBody>{bookings.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.full_name}</p><p className="text-xs text-gray-500">{item.phone} · {item.email || "no email"}</p><p className="text-xs text-gray-400">{formatDate(item.created_at)}</p></TableCell><TableCell><p>{formatDate(item.check_in)} → {formatDate(item.check_out)}</p><p className="text-xs text-gray-500">{item.guests || 1} khách</p></TableCell><TableCell>{item.room?.name || "Chưa chọn"}</TableCell><TableCell>{editable ? <select className="rounded-md border px-2 py-1 text-xs" value={item.status} onChange={(e) => updateBooking(item.id, { status: e.target.value })}><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option></select> : <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>}</TableCell><TableCell className="min-w-[260px]"><p className="text-xs text-gray-500">Khách: {item.message || "-"}</p>{editable ? <Textarea defaultValue={item.internal_note || ""} onBlur={(e) => updateBooking(item.id, { internal_note: e.target.value })} placeholder="Ghi chú nội bộ" className="mt-2 min-h-16" /> : <p className="text-xs text-gray-500">Admin: {item.internal_note || "-"}</p>}</TableCell>{editable ? <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBooking(item.id)}><Trash size={16} /></Button></TableCell> : null}</TableRow>)}</TableBody></Table></div> }

function RoomsSection(props: { rooms: Room[]; form: RoomForm; setForm: React.Dispatch<React.SetStateAction<RoomForm>>; saveRoom: (e: React.FormEvent) => void; editRoom: (room: Room) => void; deleteRoom: (id: string) => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const f = props.form; const set = (key: keyof RoomForm, value: any) => props.setForm((prev) => ({ ...prev, [key]: value }))
  async function addFiles(files?: FileList | null) { if (!files) return; for (const file of Array.from(files)) { const media = await props.uploadMedia(file); if (media) props.setForm((prev) => ({ ...prev, images: [...prev.images, { ...media, sort_order: prev.images.length }] })) } }
  const reorder = (from: number, to: number) => props.setForm((prev) => { const arr = [...prev.images]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved); return { ...prev, images: arr.map((item, index) => ({ ...item, sort_order: index })) } })
  const removeImage = (index: number) => props.setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })) }))
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-5"><Card className="lg:col-span-2"><CardHeader><CardTitle>{f.id ? "Sửa phòng" : "Thêm phòng"}</CardTitle><CardDescription>Không nhập URL ảnh nữa. Upload ảnh/video, xem preview và xếp thứ tự tại đây.</CardDescription></CardHeader><CardContent><form onSubmit={props.saveRoom} className="space-y-4"><div><Label>Tên phòng</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} required /></div><div className="grid grid-cols-2 gap-3"><div><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div><div><Label>Type</Label><Input value={f.type} onChange={(e) => set("type", e.target.value)} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Giá</Label><Input type="number" value={f.price} onChange={(e) => set("price", e.target.value)} /></div><div><Label>Giá gốc</Label><Input type="number" value={f.original_price} onChange={(e) => set("original_price", e.target.value)} /></div></div><div className="grid grid-cols-3 gap-3"><div><Label>Sức chứa</Label><Input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></div><div><Label>Số giường</Label><Input type="number" value={f.beds} onChange={(e) => set("beds", e.target.value)} /></div><div><Label>Sort</Label><Input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Loại giường</Label><Input value={f.bed_type} onChange={(e) => set("bed_type", e.target.value)} /></div><div><Label>Diện tích</Label><Input value={f.size} onChange={(e) => set("size", e.target.value)} /></div></div><div><Label>Mô tả</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div><div><Label>Amenities</Label><Textarea value={f.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Mỗi dòng 1 tiện ích" /></div><div><Label>Highlights</Label><Textarea value={f.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder="Mỗi dòng 1 nhãn" /></div><MediaUploader label="Ảnh / video phòng" multiple onFiles={addFiles} /><MediaGrid items={f.images} onMove={reorder} onRemove={removeImage} /><div className="flex items-center gap-3"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /><Label>Hiển thị trên web</Label></div><div className="flex gap-2"><Button type="submit"><Save size={16} className="mr-2" />{f.id ? "Lưu sửa" : "Thêm phòng"}</Button>{f.id ? <Button type="button" variant="outline" onClick={() => props.setForm(emptyRoomForm)}>Huỷ</Button> : null}</div></form></CardContent></Card><Card className="lg:col-span-3"><CardHeader><CardTitle>Danh sách phòng</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{props.rooms.map((room) => <div key={room.id} className="rounded-lg border bg-white p-4"><img src={mediaUrl(room.images?.[0]) || "/placeholder.jpg"} alt={room.name} className="mb-3 h-40 w-full rounded-md object-cover" /><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{room.name}</h3><p className="text-sm text-gray-500">{room.price ? new Intl.NumberFormat("vi-VN").format(room.price) : "Contact"} VND</p></div><span className={`rounded-full px-2 py-1 text-xs ${room.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{room.is_active ? "Active" : "Hidden"}</span></div><p className="mt-2 line-clamp-2 text-sm text-gray-600">{room.description}</p><p className="mt-1 text-xs text-gray-400">{room.images.length} media · sort {room.sort_order}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => props.editRoom(room)}><Edit size={14} className="mr-1" />Sửa</Button><Button size="sm" variant="ghost" onClick={() => props.deleteRoom(room.id)}><Trash size={14} className="mr-1" />Xoá</Button></div></div>)}</div></CardContent></Card></div>
}

function LandingBuilder({ landing, setLanding, rooms, save, uploadMedia }: { landing: LandingConfig; setLanding: React.Dispatch<React.SetStateAction<LandingConfig>>; rooms: Room[]; save: () => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const setTop = (group: "brand" | "theme" | "header" | "footer" | "contact", key: string, value: any) => setLanding((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))
  const setNavText = (text: string) => setTop("header", "navItems", text.split("\n").map((line) => { const [label, path] = line.split("|").map((x) => x.trim()); return { label: label || "Link", path: path || "/" } }))
  const navText = (landing.header.navItems || []).map((item: any) => `${item.label} | ${item.path}`).join("\n")
  async function uploadLogo(file?: File) { const media = await uploadMedia(file); if (media) setTop("brand", "logo", media) }
  const updateSection = (id: string, patch: Record<string, any>) => setLanding((prev) => ({ ...prev, sections: prev.sections.map((s) => s.id === id ? { ...s, ...patch } : s) }))
  const moveSection = (index: number, to: number) => setLanding((prev) => { const arr = [...prev.sections]; const [item] = arr.splice(index, 1); arr.splice(to, 0, item); return { ...prev, sections: arr.map((s, i) => ({ ...s, sort_order: i + 1 })) } })
  const removeSection = (id: string) => setLanding((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, sort_order: i + 1 })) }))
  const addSection = (type: LandingSectionType) => setLanding((prev) => ({ ...prev, sections: [...prev.sections, createSection(type, prev.sections.length + 1)] }))
  return <div className="space-y-5"><Card><CardHeader><CardTitle>Thông tin chung</CardTitle><CardDescription>Đổi tên homestay, font, màu, header/footer bằng form dễ thao tác. Nhập tên Google Font tuỳ ý.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-3"><div className="space-y-3"><h3 className="font-semibold">Brand</h3><Field label="Tên homestay"><Input value={landing.brand.name || ""} onChange={(e) => setTop("brand", "name", e.target.value)} /></Field><Field label="Logo text"><Input value={landing.brand.logoText || ""} onChange={(e) => setTop("brand", "logoText", e.target.value)} /></Field><Field label="Điện thoại"><Input value={landing.brand.phone || ""} onChange={(e) => setTop("brand", "phone", e.target.value)} /></Field><Field label="Email"><Input value={landing.brand.email || ""} onChange={(e) => setTop("brand", "email", e.target.value)} /></Field><Field label="Địa chỉ"><Textarea value={landing.brand.address || ""} onChange={(e) => setTop("brand", "address", e.target.value)} /></Field><MediaUploader label="Upload logo" onFiles={(files) => uploadLogo(files?.[0])} />{landing.brand.logo ? <MediaGrid items={[landing.brand.logo]} /> : null}</div><div className="space-y-3"><h3 className="font-semibold">Giao diện (Google Fonts)</h3><Field label="Font nội dung (ví dụ: Inter, Roboto, Outfit)"><Input placeholder="Inter, sans-serif" value={landing.theme.fontFamily || ""} onChange={(e) => setTop("theme", "fontFamily", e.target.value)} /></Field><Field label="Font tiêu đề (ví dụ: Playfair Display, Bricolage Grotesque)"><Input placeholder="Bricolage Grotesque, serif" value={landing.theme.headingFont || ""} onChange={(e) => setTop("theme", "headingFont", e.target.value)} /></Field><Field label="Màu chính"><div className="flex gap-2"><Input type="color" className="w-16" value={landing.theme.primaryColor || "#111111"} onChange={(e) => setTop("theme", "primaryColor", e.target.value)} /><Input value={landing.theme.primaryColor || "#111111"} onChange={(e) => setTop("theme", "primaryColor", e.target.value)} /></div></Field><Field label="Màu nền"><div className="flex gap-2"><Input type="color" className="w-16" value={landing.theme.backgroundColor || "#f7f5f2"} onChange={(e) => setTop("theme", "backgroundColor", e.target.value)} /><Input value={landing.theme.backgroundColor || "#f7f5f2"} onChange={(e) => setTop("theme", "backgroundColor", e.target.value)} /></div></Field></div><div className="space-y-3"><h3 className="font-semibold">Header / Footer</h3><Field label="Menu, mỗi dòng: Label | /duong-dan"><Textarea value={navText} onChange={(e) => setNavText(e.target.value)} /></Field><Field label="Nút header"><Input value={landing.header.ctaText || ""} onChange={(e) => setTop("header", "ctaText", e.target.value)} /></Field><Field label="Link nút header"><Input value={landing.header.ctaLink || ""} onChange={(e) => setTop("header", "ctaLink", e.target.value)} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={landing.footer.showCta !== false} onChange={(e) => setTop("footer", "showCta", e.target.checked)} /> Hiện CTA ở footer</label><Field label="Text Copyright"><Input value={landing.footer.copyrightText || ""} onChange={(e) => setTop("footer", "copyrightText", e.target.value)} placeholder="Copyright 2026..." /></Field><Field label="Text dưới cùng"><Input value={landing.footer.bottomText || ""} onChange={(e) => setTop("footer", "bottomText", e.target.value)} /></Field></div></CardContent></Card><Card><CardHeader><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><CardTitle>Thứ tự thành phần landing page</CardTitle><CardDescription>Dùng nút lên/xuống để kéo thứ tự. Tắt/mở hoặc thêm section mới tuỳ ý.</CardDescription></div><div className="flex flex-wrap gap-2"><AddSectionButton add={addSection} /><Button onClick={save}><Save size={16} className="mr-2" />Lưu landing</Button></div></div></CardHeader><CardContent className="space-y-4">{landing.sections.map((section, index) => <SectionEditor key={section.id} section={section} index={index} total={landing.sections.length} rooms={rooms} update={(patch) => updateSection(section.id, patch)} remove={() => removeSection(section.id)} moveUp={() => moveSection(index, index - 1)} moveDown={() => moveSection(index, index + 1)} uploadMedia={uploadMedia} />)}</CardContent></Card></div>
}

function createSection(type: LandingSectionType, sortOrder: number): LandingSection {
  const base = { id: uid(type), type, enabled: true, sort_order: sortOrder, title: sectionLabel(type) }
  if (type === "hero") return { ...base, subtitle: "Mô tả ngắn", primaryButtonText: "Xem phòng", primaryButtonLink: "/rooms", secondaryButtonText: "Đặt phòng", secondaryButtonLink: "/contact", image: null, video: null }
  if (type === "rooms") return { ...base, description: "Các phòng nổi bật", buttonText: "Xem tất cả", buttonLink: "/rooms", limit: 3, roomIds: [] }
  if (type === "welcome") return { ...base, eyebrow: "Welcome", paragraphs: ["Nội dung giới thiệu homestay"], images: [] }
  if (type === "experiences") return { ...base, description: "Các trải nghiệm nổi bật", items: [{ title: "Trải nghiệm mới", description: "Mô tả", image: null }] }
  if (type === "amenities") return { ...base, items: [{ title: "Tiện ích", description: "Mô tả" }] }
  if (type === "testimonials") return { ...base, items: [{ name: "Guest", country: "", rating: 5, text: "Review" }] }
  if (type === "gallery") return { ...base, images: [] }
  if (type === "banner") return { ...base, description: "Banner mô tả", buttonText: "Liên hệ", buttonLink: "/contact", image: null }
  return { ...base, description: "Mô tả", buttonText: "Gửi yêu cầu", buttonLink: "/contact" }
}
function sectionLabel(type: LandingSectionType) { return ({ hero: "Hero / Banner đầu trang", welcome: "Giới thiệu", experiences: "Trải nghiệm", rooms: "Show phòng", amenities: "Tiện ích", testimonials: "Đánh giá", gallery: "Thư viện ảnh", banner: "Banner", cta: "CTA đặt phòng" } as Record<LandingSectionType, string>)[type] }
function AddSectionButton({ add }: { add: (type: LandingSectionType) => void }) { const [type, setType] = useState<LandingSectionType>("banner"); return <div className="flex gap-2"><select className="rounded-md border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as LandingSectionType)}>{(["hero", "banner", "welcome", "rooms", "experiences", "amenities", "gallery", "testimonials", "cta"] as LandingSectionType[]).map((t) => <option key={t} value={t}>{sectionLabel(t)}</option>)}</select><Button variant="outline" onClick={() => add(type)}><Plus size={16} className="mr-1" />Thêm</Button></div> }

function SectionEditor(props: { section: LandingSection; index: number; total: number; rooms: Room[]; update: (patch: Record<string, any>) => void; remove: () => void; moveUp: () => void; moveDown: () => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const s = props.section
  async function uploadTo(key: string, file?: File) { const media = await props.uploadMedia(file); if (media) props.update({ [key]: media }) }
  async function addToImages(files?: FileList | null) { if (!files) return; const current = normalizeMediaList(s.images); const uploaded: MediaItem[] = []; for (const file of Array.from(files)) { const media = await props.uploadMedia(file); if (media) uploaded.push(media) } props.update({ images: [...current, ...uploaded].map((item, index) => ({ ...item, sort_order: index })) }) }
  const setItems = (items: any[]) => props.update({ items })
  const setImages = (items: MediaItem[]) => props.update({ images: items })
  return <div className="rounded-xl border bg-white p-4"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">#{props.index + 1}</span><div><h3 className="font-semibold">{sectionLabel(s.type)}</h3><p className="text-xs text-gray-500">{s.id}</p></div></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={props.index === 0} onClick={props.moveUp}><ArrowUp size={14} /></Button><Button size="sm" variant="outline" disabled={props.index === props.total - 1} onClick={props.moveDown}><ArrowDown size={14} /></Button><Button size="sm" variant={s.enabled === false ? "outline" : "default"} onClick={() => props.update({ enabled: s.enabled === false })}>{s.enabled === false ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}{s.enabled === false ? "Đang ẩn" : "Đang hiện"}</Button><Button size="sm" variant="ghost" onClick={props.remove}><Trash size={14} /></Button></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Field label="Tiêu đề"><Input value={s.title || ""} onChange={(e) => props.update({ title: e.target.value })} /></Field>{s.type !== "hero" && <Field label="Mô tả"><Textarea value={s.description || ""} onChange={(e) => props.update({ description: e.target.value })} /></Field>}{s.type === "hero" && <><Field label="Subtitle"><Textarea value={s.subtitle || ""} onChange={(e) => props.update({ subtitle: e.target.value })} /></Field><Field label="Nút chính"><Input value={s.primaryButtonText || ""} onChange={(e) => props.update({ primaryButtonText: e.target.value })} /></Field><Field label="Link nút chính"><Input value={s.primaryButtonLink || ""} onChange={(e) => props.update({ primaryButtonLink: e.target.value })} /></Field><Field label="Nút phụ"><Input value={s.secondaryButtonText || ""} onChange={(e) => props.update({ secondaryButtonText: e.target.value })} /></Field><Field label="Link nút phụ"><Input value={s.secondaryButtonLink || ""} onChange={(e) => props.update({ secondaryButtonLink: e.target.value })} /></Field><MediaUploader label="Upload video hero" accept="video/*" icon="video" onFiles={(files) => uploadTo("video", files?.[0])} /><MediaUploader label="Upload ảnh hero fallback" onFiles={(files) => uploadTo("image", files?.[0])} /></>}{s.type === "banner" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || ""} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field><MediaUploader label="Upload ảnh banner" onFiles={(files) => uploadTo("image", files?.[0])} /></>}{s.type === "welcome" && <><Field label="Eyebrow"><Input value={s.eyebrow || ""} onChange={(e) => props.update({ eyebrow: e.target.value })} /></Field><Field label="Đoạn văn, mỗi dòng 1 đoạn"><Textarea value={(s.paragraphs || []).join("\n")} onChange={(e) => props.update({ paragraphs: e.target.value.split("\n").filter(Boolean) })} /></Field><div className="md:col-span-2"><MediaUploader label="Upload ảnh giới thiệu" multiple onFiles={addToImages} /><MediaGrid items={normalizeMediaList(s.images)} onMove={(from, to) => reorderMedia(normalizeMediaList(s.images), from, to, setImages)} onRemove={(index) => removeMedia(normalizeMediaList(s.images), index, setImages)} /></div></>}{s.type === "rooms" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || "/rooms"} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field><Field label="Số phòng tối đa"><Input type="number" min="1" value={s.limit || 3} onChange={(e) => props.update({ limit: Number(e.target.value) })} /></Field><div className="md:col-span-2"><Label className="mb-2 block">Chọn phòng muốn show, bỏ trống = show theo sort trong DB</Label><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{props.rooms.map((room) => <label key={room.id} className="flex items-center gap-2 rounded-md border p-2 text-sm"><input type="checkbox" checked={(s.roomIds || []).includes(room.id)} onChange={(e) => { const ids = new Set(s.roomIds || []); e.target.checked ? ids.add(room.id) : ids.delete(room.id); props.update({ roomIds: Array.from(ids) }) }} />{room.name}</label>)}</div></div></>}{s.type === "experiences" && <ItemsEditor type="experiences" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "amenities" && <ItemsEditor type="amenities" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "testimonials" && <ItemsEditor type="testimonials" items={s.items || []} setItems={setItems} uploadMedia={props.uploadMedia} />}{s.type === "gallery" && <div className="md:col-span-2"><MediaUploader label="Upload ảnh gallery" multiple onFiles={addToImages} /><MediaGrid items={normalizeMediaList(s.images)} onMove={(from, to) => reorderMedia(normalizeMediaList(s.images), from, to, setImages)} onRemove={(index) => removeMedia(normalizeMediaList(s.images), index, setImages)} /></div>}{s.type === "cta" && <><Field label="Text nút"><Input value={s.buttonText || ""} onChange={(e) => props.update({ buttonText: e.target.value })} /></Field><Field label="Link nút"><Input value={s.buttonLink || "/contact"} onChange={(e) => props.update({ buttonLink: e.target.value })} /></Field></>}</div></div>
}

function ItemsEditor({ type, items, setItems, uploadMedia }: { type: "experiences" | "amenities" | "testimonials"; items: any[]; setItems: (items: any[]) => void; uploadMedia: (file?: File) => Promise<MediaItem | null> }) {
  const add = () => setItems([...items, type === "testimonials" ? { name: "Guest", country: "", rating: 5, text: "" } : { title: "", description: "", image: null }])
  const patch = (index: number, key: string, value: any) => setItems(items.map((item, i) => i === index ? { ...item, [key]: value } : item))
  const remove = (index: number) => setItems(items.filter((_, i) => i !== index))
  return <div className="md:col-span-2 space-y-3"><div className="flex items-center justify-between"><Label>Danh sách item</Label><Button type="button" size="sm" variant="outline" onClick={add}><Plus size={14} className="mr-1" />Thêm item</Button></div>{items.map((item, index) => <div key={index} className="rounded-lg border p-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{type === "testimonials" ? <><Field label="Tên khách"><Input value={item.name || ""} onChange={(e) => patch(index, "name", e.target.value)} /></Field><Field label="Quốc gia"><Input value={item.country || ""} onChange={(e) => patch(index, "country", e.target.value)} /></Field><Field label="Số sao"><Input type="number" min="1" max="5" value={item.rating || 5} onChange={(e) => patch(index, "rating", Number(e.target.value))} /></Field><Field label="Review"><Textarea value={item.text || ""} onChange={(e) => patch(index, "text", e.target.value)} /></Field></> : <><Field label="Tiêu đề"><Input value={item.title || ""} onChange={(e) => patch(index, "title", e.target.value)} /></Field><Field label="Mô tả"><Textarea value={item.description || ""} onChange={(e) => patch(index, "description", e.target.value)} /></Field>{type === "experiences" ? <div className="md:col-span-2"><MediaUploader label="Ảnh item" onFiles={async (files) => { const media = await uploadMedia(files?.[0]); if (media) patch(index, "image", media) }} />{item.image ? <img src={mediaUrl(item.image)} alt="" className="mt-2 h-24 w-40 rounded-md object-cover" /> : null}</div> : null}</>}<div><Button type="button" size="sm" variant="ghost" onClick={() => remove(index)}><Trash size={14} className="mr-1" />Xoá item</Button></div></div></div>)}</div>
}

function reorderMedia(items: MediaItem[], from: number, to: number, setItems?: (items: MediaItem[]) => void) { if (!setItems || to < 0 || to >= items.length) return; const arr = [...items]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved); setItems(arr.map((item, index) => ({ ...item, sort_order: index }))) }
function removeMedia(items: MediaItem[], index: number, setItems?: (items: MediaItem[]) => void) { if (!setItems) return; setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i }))) }
function MediaUploader({ label, accept = "image/*,video/*", multiple, onFiles, icon = "image" }: { label: string; accept?: string; multiple?: boolean; onFiles: (files?: FileList | null) => void; icon?: "image" | "video" }) { return <div className="rounded-md border border-dashed p-3"><Label className="mb-2 flex items-center gap-2">{icon === "video" ? <Video size={16} /> : <ImageUp size={16} />}{label}</Label><Input type="file" accept={accept} multiple={multiple} onChange={(e) => onFiles(e.target.files)} /><p className="mt-1 text-xs text-gray-500">Ảnh sẽ đổi sang webp, video đổi sang mp4 web trước khi upload Cloudinary.</p></div> }
function MediaGrid({ items, onMove, onRemove }: { items: MediaItem[]; onMove?: (from: number, to: number) => void; onRemove?: (index: number) => void }) { if (!items.length) return <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Chưa có media nào.</p>; return <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{items.map((item, index) => <div key={`${item.url}-${index}`} className="rounded-lg border bg-white p-2"><div className="relative h-24 overflow-hidden rounded-md bg-gray-100">{item.type === "video" ? <video src={item.url} className="h-full w-full object-cover" muted /> : <img src={item.url} alt={item.alt || "media"} className="h-full w-full object-cover" />}<span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">#{index + 1}</span></div><div className="mt-2 flex justify-between gap-1"><Button type="button" size="sm" variant="outline" disabled={!onMove || index === 0} onClick={() => onMove?.(index, index - 1)}><ArrowUp size={12} /></Button><Button type="button" size="sm" variant="outline" disabled={!onMove || index === items.length - 1} onClick={() => onMove?.(index, index + 1)}><ArrowDown size={12} /></Button>{onRemove ? <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(index)}><Trash size={12} /></Button> : null}</div></div>)}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1"><span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>{children}</label> }
