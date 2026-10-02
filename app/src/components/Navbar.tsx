import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { mediaUrl } from '../lib/media'
import type { LandingPage } from '../types/api'

export default function Navbar({ landing }: { landing: LandingPage }) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const brand = landing.brand || {}
  const header = landing.header || {}
  const navItems = Array.isArray(header.navItems) ? header.navItems : []
  const logoUrl = mediaUrl(brand.logo)

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
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#111]">
            {logoUrl ? <img src={logoUrl} alt={brand.name || ''} className="h-full w-full object-cover" /> : <span className="font-serif text-sm font-semibold tracking-tight text-white">{String(brand.logoText || brand.name || '').slice(0, 2).toUpperCase()}</span>}
          </div>
          {brand.logoText || brand.name ? <span className="hidden font-serif text-lg font-medium tracking-tight sm:block">{brand.logoText || brand.name}</span> : null}
        </Link>

        <div className="hidden items-center rounded-full px-1.5 py-1.5 md:flex" style={{ backgroundColor: scrolled ? '#f2f0ed' : 'rgba(242, 240, 237, 0.6)' }}>
          {navItems.map((item: any) => {
            const path = item.path || '/'
            const isActive = location.pathname === path
            return (
              <Link
                key={`${item.label}-${path}`}
                to={path}
                className="relative rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-300"
                style={{ color: isActive ? '#111' : 'rgba(17, 17, 17, 0.5)', backgroundColor: isActive ? '#ffffff' : 'transparent' }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {header.ctaText ? (
          <Link to={header.ctaLink || '/contact'} className="btn-pill text-xs uppercase tracking-wider text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
            {header.ctaText}
          </Link>
        ) : <span />}
      </div>
    </nav>
  )
}
