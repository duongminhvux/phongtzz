"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Edit, Home, ImageUp, LayoutDashboard, LogOut, MessageSquare, Plus, Save, Search, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

type BookingStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CANCELLED"

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
  images: string[]
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
  images: string
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
  images: "",
  is_active: true,
  sort_order: "0",
}

function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("phong_admin_token") || ""
}

function setToken(token: string) {
  localStorage.setItem("phong_admin_token", token)
}

function clearToken() {
  localStorage.removeItem("phong_admin_token")
}

function splitList(value: string) {
  return value.split("\n").flatMap((line) => line.split(",")).map((item) => item.trim()).filter(Boolean)
}

function joinList(value?: string[]) {
  return (value || []).join("\n")
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value))
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
  const [landingJson, setLandingJson] = useState("")
  const [bookingQuery, setBookingQuery] = useState("")
  const [bookingStatus, setBookingStatus] = useState("")
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm)

  const stats = useMemo(() => {
    return {
      totalBookings: bookings.length,
      newBookings: bookings.filter((item) => item.status === "NEW").length,
      contacted: bookings.filter((item) => item.status === "CONTACTED").length,
      rooms: rooms.length,
    }
  }, [bookings, rooms])

  const authHeaders = () => ({ Authorization: `Bearer ${token || getToken()}` })

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...authHeaders(),
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
    if (response.status === 204) return undefined as T
    return response.json()
  }

  async function loadAll() {
    if (!getToken()) return
    setLoading(true)
    setError("")
    try {
      const [bookingData, roomData, landingData] = await Promise.all([
        api<BookingRequest[]>("/admin/booking-requests"),
        api<Room[]>("/admin/rooms"),
        api<{ value: Record<string, unknown> }>("/admin/landing-page"),
      ])
      setBookings(bookingData)
      setRooms(roomData)
      setLandingJson(JSON.stringify(landingData.value, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = getToken()
    if (saved) {
      setTokenState(saved)
      loadAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Sai email hoặc mật khẩu")
        return res.json()
      })
      setToken(data.access_token)
      setTokenState(data.access_token)
      setMessage("Đăng nhập thành công")
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập lỗi")
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearToken()
    setTokenState("")
  }

  async function refreshBookings() {
    const params = new URLSearchParams()
    if (bookingQuery) params.set("q", bookingQuery)
    if (bookingStatus) params.set("status", bookingStatus)
    const data = await api<BookingRequest[]>(`/admin/booking-requests?${params.toString()}`)
    setBookings(data)
  }

  async function updateBooking(id: string, payload: Partial<Pick<BookingRequest, "status" | "internal_note">>) {
    setError("")
    try {
      await api(`/admin/booking-requests/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      setMessage("Đã cập nhật booking request")
      await refreshBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được")
    }
  }

  async function deleteBooking(id: string) {
    if (!confirm("Xoá booking request này?")) return
    await api(`/admin/booking-requests/${id}`, { method: "DELETE" })
    await refreshBookings()
  }

  function editRoom(room: Room) {
    setRoomForm({
      id: room.id,
      name: room.name,
      slug: room.slug,
      type: room.type,
      price: room.price?.toString() || "",
      original_price: room.original_price?.toString() || "",
      capacity: room.capacity?.toString() || "",
      beds: room.beds?.toString() || "",
      bed_type: room.bed_type || "",
      size: room.size || "",
      description: room.description || "",
      amenities: joinList(room.amenities),
      highlights: joinList(room.highlights),
      images: joinList(room.images),
      is_active: room.is_active,
      sort_order: room.sort_order?.toString() || "0",
    })
  }

  async function saveRoom(event: React.FormEvent) {
    event.preventDefault()
    const payload = {
      name: roomForm.name,
      slug: roomForm.slug || undefined,
      type: roomForm.type || "private",
      price: roomForm.price ? Number(roomForm.price) : null,
      original_price: roomForm.original_price ? Number(roomForm.original_price) : null,
      capacity: roomForm.capacity ? Number(roomForm.capacity) : null,
      beds: roomForm.beds ? Number(roomForm.beds) : null,
      bed_type: roomForm.bed_type || null,
      size: roomForm.size || null,
      description: roomForm.description || null,
      amenities: splitList(roomForm.amenities),
      highlights: splitList(roomForm.highlights),
      images: splitList(roomForm.images),
      is_active: roomForm.is_active,
      sort_order: Number(roomForm.sort_order || 0),
    }
    const path = roomForm.id ? `/admin/rooms/${roomForm.id}` : "/admin/rooms"
    const method = roomForm.id ? "PATCH" : "POST"
    await api(path, { method, body: JSON.stringify(payload) })
    setRoomForm(emptyRoomForm)
    setMessage("Đã lưu phòng")
    setRooms(await api<Room[]>("/admin/rooms"))
  }

  async function deleteRoom(id: string) {
    if (!confirm("Xoá phòng này?")) return
    await api(`/admin/rooms/${id}`, { method: "DELETE" })
    setRooms(await api<Room[]>("/admin/rooms"))
  }

  async function saveLanding() {
    setError("")
    try {
      const value = JSON.parse(landingJson)
      await api("/admin/landing-page", { method: "PATCH", body: JSON.stringify({ value }) })
      setMessage("Đã lưu landing page")
    } catch (err) {
      setError(err instanceof SyntaxError ? "JSON chưa hợp lệ" : err instanceof Error ? err.message : "Không lưu được")
    }
  }

  async function uploadImage(file?: File) {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const data = await api<{ url: string }>("/admin/uploads/image", { method: "POST", body: formData })
      await navigator.clipboard?.writeText(data.url)
      setMessage(`Upload xong, URL đã copy: ${data.url}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload lỗi")
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Phongtzzz Admin</CardTitle>
            <CardDescription>Đăng nhập để quản lý booking request, phòng và landing page.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <Button className="w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Login"}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 border-r bg-white md:block">
        <div className="border-b p-6">
          <h1 className="text-2xl font-semibold text-purple-600">Phongtzzz</h1>
          <p className="mt-1 text-sm text-gray-500">Booking Request Admin</p>
        </div>
        <nav className="space-y-1 p-3">
          <NavButton active={section === "dashboard"} onClick={() => setSection("dashboard")} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavButton active={section === "bookings"} onClick={() => setSection("bookings")} icon={<MessageSquare size={18} />} label="Booking Requests" />
          <NavButton active={section === "rooms"} onClick={() => setSection("rooms")} icon={<Home size={18} />} label="Rooms" />
          <NavButton active={section === "landing"} onClick={() => setSection("landing")} icon={<Edit size={18} />} label="Landing Page" />
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
          <div>
            <h2 className="text-xl font-semibold">{sectionTitle(section)}</h2>
            <p className="text-sm text-gray-500">FastAPI + PostgreSQL backend</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadAll} disabled={loading}>Refresh</Button>
            <Button variant="ghost" onClick={logout}><LogOut size={16} className="mr-2" />Logout</Button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
          {message ? <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          {section === "dashboard" ? <DashboardSection stats={stats} bookings={bookings.slice(0, 5)} /> : null}
          {section === "bookings" ? (
            <BookingsSection
              bookings={bookings}
              query={bookingQuery}
              status={bookingStatus}
              setQuery={setBookingQuery}
              setStatus={setBookingStatus}
              refresh={refreshBookings}
              updateBooking={updateBooking}
              deleteBooking={deleteBooking}
            />
          ) : null}
          {section === "rooms" ? (
            <RoomsSection
              rooms={rooms}
              form={roomForm}
              setForm={setRoomForm}
              saveRoom={saveRoom}
              editRoom={editRoom}
              deleteRoom={deleteRoom}
              uploadImage={uploadImage}
            />
          ) : null}
          {section === "landing" ? <LandingSection json={landingJson} setJson={setLandingJson} save={saveLanding} uploadImage={uploadImage} /> : null}
        </div>
      </main>
    </div>
  )
}

function sectionTitle(section: Section) {
  return section === "dashboard" ? "Dashboard" : section === "bookings" ? "Booking Requests" : section === "rooms" ? "Rooms" : "Landing Page Customization"
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
      {icon}{label}
    </button>
  )
}

function DashboardSection({ stats, bookings }: { stats: any; bookings: BookingRequest[] }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Requests" value={stats.totalBookings} icon={<MessageSquare />} />
        <StatCard title="New" value={stats.newBookings} icon={<CalendarDays />} />
        <StatCard title="Contacted" value={stats.contacted} icon={<Search />} />
        <StatCard title="Rooms" value={stats.rooms} icon={<Home />} />
      </div>
      <Card>
        <CardHeader><CardTitle>Latest booking requests</CardTitle></CardHeader>
        <CardContent><BookingTable bookings={bookings} /></CardContent>
      </Card>
    </>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold">{value}</p></div><div className="rounded-full bg-blue-50 p-3 text-blue-600">{icon}</div></CardContent></Card>
}

function BookingsSection(props: {
  bookings: BookingRequest[]
  query: string
  status: string
  setQuery: (v: string) => void
  setStatus: (v: string) => void
  refresh: () => void
  updateBooking: (id: string, payload: Partial<Pick<BookingRequest, "status" | "internal_note">>) => void
  deleteBooking: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Requests</CardTitle>
        <CardDescription>Quản lý khách gửi yêu cầu đặt phòng. Không check phòng trống tự động.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input placeholder="Tìm tên / SĐT / email" value={props.query} onChange={(e) => props.setQuery(e.target.value)} />
          <select className="rounded-md border px-3 py-2 text-sm" value={props.status} onChange={(e) => props.setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <Button onClick={props.refresh}><Search size={16} className="mr-2" />Filter</Button>
        </div>
        <BookingTable bookings={props.bookings} updateBooking={props.updateBooking} deleteBooking={props.deleteBooking} editable />
      </CardContent>
    </Card>
  )
}

function BookingTable({ bookings, editable, updateBooking, deleteBooking }: { bookings: BookingRequest[]; editable?: boolean; updateBooking?: any; deleteBooking?: any }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Khách</TableHead><TableHead>Ngày</TableHead><TableHead>Phòng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ghi chú</TableHead>{editable ? <TableHead>Action</TableHead> : null}</TableRow></TableHeader>
        <TableBody>
          {bookings.map((item) => (
            <TableRow key={item.id}>
              <TableCell><p className="font-medium">{item.full_name}</p><p className="text-xs text-gray-500">{item.phone} · {item.email || "no email"}</p><p className="text-xs text-gray-400">{formatDate(item.created_at)}</p></TableCell>
              <TableCell><p>{formatDate(item.check_in)} → {formatDate(item.check_out)}</p><p className="text-xs text-gray-500">{item.guests || 1} khách</p></TableCell>
              <TableCell>{item.room?.name || "Chưa chọn"}</TableCell>
              <TableCell>
                {editable ? (
                  <select className="rounded-md border px-2 py-1 text-xs" value={item.status} onChange={(e) => updateBooking(item.id, { status: e.target.value })}>
                    <option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>}
              </TableCell>
              <TableCell className="min-w-[260px]">
                <p className="text-xs text-gray-500">Khách: {item.message || "-"}</p>
                {editable ? <Textarea defaultValue={item.internal_note || ""} onBlur={(e) => updateBooking(item.id, { internal_note: e.target.value })} placeholder="Ghi chú nội bộ" className="mt-2 min-h-16" /> : <p className="text-xs text-gray-500">Admin: {item.internal_note || "-"}</p>}
              </TableCell>
              {editable ? <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBooking(item.id)}><Trash size={16} /></Button></TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RoomsSection(props: { rooms: Room[]; form: RoomForm; setForm: React.Dispatch<React.SetStateAction<RoomForm>>; saveRoom: (e: React.FormEvent) => void; editRoom: (room: Room) => void; deleteRoom: (id: string) => void; uploadImage: (file?: File) => void }) {
  const f = props.form
  const set = (key: keyof RoomForm, value: any) => props.setForm((prev) => ({ ...prev, [key]: value }))
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>{f.id ? "Sửa phòng" : "Thêm phòng"}</CardTitle><CardDescription>Mỗi dòng trong Images/Amenities/Highlights là 1 item.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={props.saveRoom} className="space-y-4">
            <div><Label>Tên phòng</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div><div><Label>Type</Label><Input value={f.type} onChange={(e) => set("type", e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Giá</Label><Input type="number" value={f.price} onChange={(e) => set("price", e.target.value)} /></div><div><Label>Giá gốc</Label><Input type="number" value={f.original_price} onChange={(e) => set("original_price", e.target.value)} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label>Sức chứa</Label><Input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></div><div><Label>Số giường</Label><Input type="number" value={f.beds} onChange={(e) => set("beds", e.target.value)} /></div><div><Label>Sort</Label><Input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Loại giường</Label><Input value={f.bed_type} onChange={(e) => set("bed_type", e.target.value)} /></div><div><Label>Diện tích</Label><Input value={f.size} onChange={(e) => set("size", e.target.value)} /></div></div>
            <div><Label>Mô tả</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
            <div><Label>Amenities</Label><Textarea value={f.amenities} onChange={(e) => set("amenities", e.target.value)} /></div>
            <div><Label>Highlights</Label><Textarea value={f.highlights} onChange={(e) => set("highlights", e.target.value)} /></div>
            <div><Label>Images URL</Label><Textarea value={f.images} onChange={(e) => set("images", e.target.value)} /></div>
            <div className="flex items-center gap-3"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /><Label>Hiển thị trên web</Label></div>
            <div className="flex gap-2"><Button type="submit"><Save size={16} className="mr-2" />{f.id ? "Lưu sửa" : "Thêm phòng"}</Button>{f.id ? <Button type="button" variant="outline" onClick={() => props.setForm(emptyRoomForm)}>Huỷ</Button> : null}</div>
          </form>
          <div className="mt-5 rounded-md border border-dashed p-4">
            <Label className="mb-2 block">Upload ảnh Cloudinary</Label>
            <Input type="file" accept="image/*" onChange={(e) => props.uploadImage(e.target.files?.[0])} />
            <p className="mt-2 text-xs text-gray-500">Upload xong URL sẽ được copy, paste vào Images URL.</p>
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>Danh sách phòng</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {props.rooms.map((room) => (
              <div key={room.id} className="rounded-lg border bg-white p-4">
                <img src={room.images?.[0] || "/placeholder.jpg"} alt={room.name} className="mb-3 h-40 w-full rounded-md object-cover" />
                <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{room.name}</h3><p className="text-sm text-gray-500">{room.price ? new Intl.NumberFormat("vi-VN").format(room.price) : "Contact"} VND</p></div><span className={`rounded-full px-2 py-1 text-xs ${room.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{room.is_active ? "Active" : "Hidden"}</span></div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{room.description}</p>
                <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => props.editRoom(room)}><Edit size={14} className="mr-1" />Sửa</Button><Button size="sm" variant="ghost" onClick={() => props.deleteRoom(room.id)}><Trash size={14} className="mr-1" />Xoá</Button></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LandingSection({ json, setJson, save, uploadImage }: { json: string; setJson: (v: string) => void; save: () => void; uploadImage: (file?: File) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize landing page</CardTitle>
        <CardDescription>Toàn bộ nội dung landing page nằm trong JSON này: brand, hero, welcome, experiences, amenities, testimonials, gallery, contact, cta. Sửa text/link/ảnh rồi bấm lưu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-dashed p-4">
          <Label className="mb-2 flex items-center gap-2"><ImageUp size={16} />Upload ảnh Cloudinary</Label>
          <Input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} />
          <p className="mt-2 text-xs text-gray-500">URL ảnh sẽ được copy vào clipboard để paste vào JSON.</p>
        </div>
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} className="min-h-[650px] font-mono text-xs" spellCheck={false} />
        <Button onClick={save}><Save size={16} className="mr-2" />Save Landing Page</Button>
      </CardContent>
    </Card>
  )
}
