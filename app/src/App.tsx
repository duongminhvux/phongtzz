import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Contact from './pages/Contact'
import Tours from './pages/Tours'
import TourDetail from './pages/TourDetail'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SeoManager from './components/SeoManager'
import FloatingContact from './components/FloatingContact'
import { getPublicSite } from './lib/api'
import { ensureRemoteFonts, normalizeFontStack } from './lib/fonts'
import type { PublicSite } from './types/api'

export default function App() {
  const [site, setSite] = useState<PublicSite | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getPublicSite()
        if (cancelled) return
        setSite(data)
        setError('')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu website')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const theme = site?.landing.theme || {}
  const bodyFont = normalizeFontStack(theme.fontFamily, "'Inter', Arial, sans-serif")
  const headingFont = normalizeFontStack(theme.headingFont, "'Bricolage Grotesque', Arial, sans-serif")

  useEffect(() => {
    if (!site) return
    ensureRemoteFonts([theme.fontFamily, theme.headingFont])
  }, [site, theme.fontFamily, theme.headingFont])

  const style = useMemo(() => ({
    '--body-font': bodyFont,
    '--heading-font': headingFont,
    '--primary-color': theme.primaryColor || '#111111',
    '--page-bg': theme.backgroundColor || '#f7f5f2',
    fontFamily: bodyFont,
  } as CSSProperties), [bodyFont, headingFont, theme.primaryColor, theme.backgroundColor])

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] p-6 text-center"><div><h1 className="text-2xl font-semibold">Không tải được website</h1><p className="mt-3 text-sm text-black/60">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-black px-5 py-2 text-sm text-white">Tải lại</button></div></main>
  }

  if (!site) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] text-sm text-black/50">Đang tải dữ liệu...</main>
  }

  return (
    <div style={style}>
      <SeoManager site={site} />
      <Navbar landing={site.landing} />
      <Routes>
        <Route path="/" element={<Home landing={site.landing} rooms={site.rooms} />} />
        <Route path="/rooms" element={<Rooms landing={site.landing} rooms={site.rooms} />} />
        <Route path="/contact" element={<Contact landing={site.landing} rooms={site.rooms} tours={site.tours} addons={site.tour_addons} />} />
        <Route path="/tours" element={<Tours page={site.tours_page} tours={site.tours} addons={site.tour_addons} />} />
        <Route path="/tours/:slug" element={<TourDetail tours={site.tours} />} />
      </Routes>
      <Footer landing={site.landing} />
      <FloatingContact landing={site.landing} />
    </div>
  )
}
