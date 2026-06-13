import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { getLandingPage } from '../lib/api'
import { defaultLandingPage } from '../data/defaultLanding'

export default function Footer() {
  const [landing, setLanding] = useState(defaultLandingPage)

  useEffect(() => {
    getLandingPage().then((data) => setLanding({ ...defaultLandingPage, ...data }))
  }, [])

  const brand = landing.brand || defaultLandingPage.brand
  const cta = landing.cta || defaultLandingPage.cta

  return (
    <footer style={{ backgroundColor: '#f7f5f2' }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="mb-16">
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(36px, 5vw, 78px)', lineHeight: '1.05' }}>
            {cta.title}
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-lg text-black/60">{cta.description}</p>
          <Link to={cta.buttonLink || '/contact'} className="btn-pill mt-8 bg-[#111] text-xs uppercase tracking-wider text-white">
            {cta.buttonText || 'Send Booking Request'}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-12 border-t border-black/10 pt-12 md:grid-cols-3">
          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">Quick links</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/rooms', label: 'Rooms' },
                { to: '/contact', label: 'Booking Request' },
              ].map((link) => (
                <li key={link.to}><Link to={link.to} className="font-sans text-sm transition-opacity hover:opacity-60">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.address}</span></li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.phone}</span></li>
              <li className="flex items-center gap-3"><Mail size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.email}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">Follow Us</h4>
            <p className="mb-4 font-sans text-sm text-black/70">{brand.name} Homestay</p>
            <div className="flex items-center gap-4">
              <a href={brand.facebookUrl || '#'} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Facebook size={16} /></a>
              <a href={brand.instagramUrl || '#'} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Instagram size={16} /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-black/10 px-6 py-6 sm:flex-row">
        <p className="font-sans text-xs text-black/40">Copyright 2026 &copy; {brand.name} Homestay. All rights reserved.</p>
        <p className="font-sans text-xs text-black/40">Booking request website</p>
      </div>
    </footer>
  )
}
