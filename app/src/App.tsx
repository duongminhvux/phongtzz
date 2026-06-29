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
    getLandingPage().then(setLanding)
  }, [])

  const theme = (landing.theme || {}) as Record<string, any>
  const style = {
    '--body-font': theme.fontFamily,
    '--heading-font': theme.headingFont,
    '--primary-color': theme.primaryColor,
    '--page-bg': theme.backgroundColor,
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
