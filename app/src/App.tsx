import { useEffect, useState, type CSSProperties } from 'react'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Contact from './pages/Contact'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { getLandingPage } from './lib/api'
import { defaultLandingPage } from './data/defaultLanding'
import { normalizeLandingPage } from './lib/media'
import type { LandingPage } from './types/api'

export default function App() {
  const [landing, setLanding] = useState<LandingPage>(() => normalizeLandingPage(defaultLandingPage))

  useEffect(() => {
    getLandingPage().then((data) => {
      setLanding(data)
      const theme = data.theme || {}
      
      const fontsToLoad = new Set<string>()
      const extractFontName = (fontFamily: string) => {
        if (!fontFamily) return null
        const match = fontFamily.match(/^['"]?([^,'"]+)['"]?/)
        return match ? match[1].trim() : null
      }
      
      const bodyFont = extractFontName(theme.fontFamily)
      const headingFont = extractFontName(theme.headingFont)
      
      const isSystemFont = (name: string) => /^(Inter|System UI|Arial|Georgia|Verdana|Times New Roman|sans-serif|serif)$/i.test(name) || !name

      if (bodyFont && !isSystemFont(bodyFont)) fontsToLoad.add(bodyFont)
      if (headingFont && !isSystemFont(headingFont)) fontsToLoad.add(headingFont)

      if (fontsToLoad.size > 0) {
        const linkId = 'dynamic-google-fonts'
        let link = document.getElementById(linkId) as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          document.head.appendChild(link)
        }
        const families = Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&')
        link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
      }
    })
  }, [])

  const theme = (landing.theme || {}) as Record<string, any>
  const style = {
    '--body-font': theme.fontFamily || 'Inter, sans-serif',
    '--heading-font': theme.headingFont || 'Bricolage Grotesque, sans-serif',
    '--primary-color': theme.primaryColor || '#111111',
    '--page-bg': theme.backgroundColor || '#f7f5f2',
  } as CSSProperties

  return (
    <div style={style}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </div>
  )
}
