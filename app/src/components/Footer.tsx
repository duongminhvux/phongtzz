import { Link } from 'react-router'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import type { LandingPage } from '../types/api'

export default function Footer({ landing }: { landing: LandingPage }) {
  const brand = landing.brand || {}
  const footer = landing.footer || {}
  const cta = (((landing.sections || []).find((section) => section.type === 'cta' && section.enabled !== false)) || {}) as Record<string, any>
  const mapEmbedUrl = footer.mapEmbedUrl || brand.mapEmbedUrl || ''
  const navItems = Array.isArray(landing.header?.navItems) ? landing.header?.navItems : []

  return (
    <footer style={{ backgroundColor: 'var(--page-bg, #f7f5f2)' }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        {footer.showCta !== false && cta.title ? (
          <div className="mb-16">
            <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(36px, 5vw, 78px)', lineHeight: '1.05' }}>{cta.title}</h2>
            {cta.description ? <p className="mt-4 max-w-2xl font-sans text-lg text-black/60">{cta.description}</p> : null}
            {cta.buttonText ? <Link to={cta.buttonLink || '/contact'} className="btn-pill mt-8 text-xs uppercase tracking-wider text-white" style={{ backgroundColor: 'var(--primary-color)' }}>{cta.buttonText}</Link> : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-12 border-t border-black/10 pt-12 md:grid-cols-3">
          <div>
            {footer.quickLinksTitle ? <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.quickLinksTitle}</h4> : null}
            <ul className="space-y-3">
              {navItems.map((link: any) => <li key={`${link.label}-${link.path}`}><Link to={link.path || '/'} className="font-sans text-sm transition-opacity hover:opacity-60">{link.label}</Link></li>)}
            </ul>
          </div>

          <div>
            {footer.contactTitle ? <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.contactTitle}</h4> : null}
            <ul className="space-y-4">
              {brand.address ? <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.address}</span></li> : null}
              {brand.phone ? <li className="flex items-center gap-3"><Phone size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.phone}</span></li> : null}
              {brand.email ? <li className="flex items-center gap-3"><Mail size={16} className="shrink-0 text-black/50" /><span className="font-sans text-sm text-black/70">{brand.email}</span></li> : null}
            </ul>
          </div>

          <div>
            {footer.socialTitle ? <h4 className="mb-6 font-sans text-xs uppercase tracking-wider text-black/50">{footer.socialTitle}</h4> : null}
            {brand.name ? <p className="mb-4 font-sans text-sm text-black/70">{brand.name}</p> : null}
            <div className="flex items-center gap-4">
              {brand.facebookUrl && brand.facebookUrl !== '#' ? <a href={brand.facebookUrl} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Facebook size={16} /></a> : null}
              {brand.instagramUrl && brand.instagramUrl !== '#' ? <a href={brand.instagramUrl} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110"><Instagram size={16} /></a> : null}
            </div>
          </div>
        </div>

        {mapEmbedUrl ? (
          <div className="mt-12 overflow-hidden border border-black/10 bg-white" style={{ borderRadius: 24, aspectRatio: '16/7' }}>
            <iframe src={mapEmbedUrl} title={`${brand.name || 'Homestay'} map`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-black/10 px-6 py-6 sm:flex-row">
        {footer.copyrightText ? <p className="font-sans text-xs text-black/40">{footer.copyrightText}</p> : <span />}
        {footer.bottomText ? <p className="font-sans text-xs text-black/40">{footer.bottomText}</p> : null}
      </div>
    </footer>
  )
}
