import { useEffect, useState, type CSSProperties } from 'react'
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
import type { PublicSite } from './types/api'

export default function App() {
  const [site, setSite] = useState<PublicSite | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPublicSite()
      .then((data) => {
        setSite(data)
        const theme = data.landing.theme || {}
        const fontsToLoad = new Set<string>()
        const extractFontName = (fontFamily: string) => {
          if (!fontFamily) return null
          const match = fontFamily.match(/^['"]?([^,'"]+)['"]?/)
          return match ? match[1].trim() : null
        }
        const isSystemFont = (name: string) => /^(Inter|System UI|Arial|Georgia|Verdana|Times New Roman|sans-serif|serif)$/i.test(name) || !name
        const bodyFont = extractFontName(theme.fontFamily)
        const headingFont = extractFontName(theme.headingFont)
        if (bodyFont && !isSystemFont(bodyFont)) fontsToLoad.add(bodyFont)
        if (headingFont && !isSystemFont(headingFont)) fontsToLoad.add(headingFont)
        if (fontsToLoad.size > 0) {
          const linkId = 'dynamic-google-fonts'
          let link = document.getElementById(linkId) as HTMLLinkElement | null
          if (!link) {
            link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            document.head.appendChild(link)
          }
          const families = Array.from(fontsToLoad).map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&')
          link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu website'))
  }, [])

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] p-6 text-center"><div><h1 className="text-2xl font-semibold">Không tải được website</h1><p className="mt-3 text-sm text-black/60">{error}</p></div></main>
  }

  if (!site) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] text-sm text-black/50">Đang tải dữ liệu...</main>
  }

  const theme = site.landing.theme || {}
  const style = {
    '--body-font': theme.fontFamily || 'Inter, sans-serif',
    '--heading-font': theme.headingFont || 'Georgia, serif',
    '--primary-color': theme.primaryColor || '#111111',
    '--page-bg': theme.backgroundColor || '#f7f5f2',
  } as CSSProperties

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
