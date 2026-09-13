import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { getLandingPage } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'
import { normalizeLandingPage } from '../lib/media'
import type { LandingPage } from '../types/api'

export default function Footer() {
  const [landing, setLanding] = useState<LandingPage>(() => normalizeLandingPage(defaultLandingPage))

  useEffect(() => {
    getLandingPage().then(setLanding)
  }, [])

  const brand = (landing.brand || {}) as Record<string, any>
  const footer = (landing.footer || {}) as Record<string, any>
  const cta = (((landing.sections || []).find((section) => section.type === 'cta' && section.enabled !== false)) || {}) as Record<string, any>
  const navItems = landing.header?.navItems || [
    { path: '/', label: 'Home' },
    { path: '/rooms', label: 'Rooms' },
    { path: '/contact', label: 'Booking Request' },
  ]

  return (
    <footer style={{ backgroundColor: '#f7f5f2' }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        {footer.showCta !== false ? (
          <div className="mb-16">
            <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(36px, 5vw, 78px)', lineHeight: '1.05' }}>{cta.title || 'Ready for your mountain stay?'}</h2>
            <p className="mt-4 max-w-2xl font-sans text-lg text-black/60">{cta.description}</p>
            <Link to={cta.buttonLink || '/contact'} className="btn-pill mt-8 text-xs uppercase tracking-wider text-white" style={{ backgroundColor: 'var(--primary-color)' }}>{cta.buttonText || 'Send Booking Request'}</Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-12 border-t border-black/10 pt-12 md:grid-cols-3">
          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.quickLinksTitle || 'Quick links'}</h4>
            <ul className="space-y-3">
              {navItems.map((link: any) => <li key={link.path}><Link to={link.path || '/'} className="font-sans text-sm transition-opacity hover:opacity-60">{link.label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.contactTitle || 'Contact Us'}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.address}</span></li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.phone}</span></li>
              <li className="flex items-center gap-3"><Mail size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.email}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.socialTitle || 'Follow Us'}</h4>
            <p className="mb-4 font-sans text-sm text-black/70">{brand.name} Homestay</p>
            <div className="flex items-center gap-4">
              <a href={brand.facebookUrl || '#'} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Facebook size={16} /></a>
              <a href={brand.instagramUrl || '#'} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Instagram size={16} /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-black/10 px-6 py-6 sm:flex-row">
        <p className="font-sans text-xs text-black/40">{footer.copyrightText || `Copyright 2026 © ${brand.name} Homestay. All rights reserved.`}</p>
        <p className="font-sans text-xs text-black/40">{footer.bottomText || 'Booking request website'}</p>
      </div>
    </footer>
  )
}
