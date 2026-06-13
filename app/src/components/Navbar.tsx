import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getLandingPage } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [brand, setBrand] = useState(defaultLandingPage.brand)
  const location = useLocation()
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    getLandingPage().then((data) => setBrand(data.brand || defaultLandingPage.brand))
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/rooms', label: 'Rooms' },
    { path: '/contact', label: 'Booking Request' },
  ]

  return (
    <nav
      ref={navRef}
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-500"
      style={{
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        backgroundColor: scrolled ? 'rgba(247, 245, 242, 0.85)' : 'transparent',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111]">
            <span className="font-serif text-sm font-semibold tracking-tight text-white">PT</span>
          </div>
          <span className="hidden font-serif text-lg font-medium tracking-tight sm:block">{brand.logoText || brand.name}</span>
        </Link>

        <div className="hidden items-center rounded-full px-1.5 py-1.5 md:flex" style={{ backgroundColor: scrolled ? '#f2f0ed' : 'rgba(242, 240, 237, 0.6)' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-300"
                style={{ color: isActive ? '#111' : 'rgba(17, 17, 17, 0.5)', backgroundColor: isActive ? '#ffffff' : 'transparent' }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <Link to="/contact" className="btn-pill bg-[#111] text-xs uppercase tracking-wider text-white">
          Book Now
        </Link>
      </div>
    </nav>
  )
}
