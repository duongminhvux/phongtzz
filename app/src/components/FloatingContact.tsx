import { MessageCircle } from 'lucide-react'
import type { LandingPage } from '../types/api'

export default function FloatingContact({ landing }: { landing: LandingPage }) {
  const brand = landing.brand || {}
  const whatsappRaw = String(brand.whatsapp || brand.phone || '').trim()
  const whatsappDigits = whatsappRaw.replace(/\D/g, '')
  const whatsappUrl = brand.whatsappUrl || (whatsappDigits ? `https://wa.me/${whatsappDigits}` : '')
  const zaloRaw = String(brand.zaloUrl || brand.zalo || brand.phone || '').trim()
  const zaloUrl = zaloRaw ? (zaloRaw.startsWith('http') ? zaloRaw : `https://zalo.me/${zaloRaw.replace(/\D/g, '')}`) : ''
  if (!whatsappUrl && !zaloUrl) return null

  return <div className="fixed bottom-5 right-5 z-[90] flex flex-col gap-3">
    {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Open WhatsApp" title="WhatsApp" className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"><MessageCircle size={25} /><span className="sr-only">WhatsApp</span></a> : null}
    {zaloUrl ? <a href={zaloUrl} target="_blank" rel="noreferrer" aria-label="Open Zalo" title="Zalo" className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0068ff] text-white shadow-lg transition-transform hover:scale-105"><span className="text-sm font-bold">Zalo</span></a> : null}
  </div>
}
