import type { CSSProperties } from 'react'

export type LandingMediaDisplay = {
  aspectRatio?: '3:2' | '1:1' | '4:5' | '16:9'
  widthPercent?: number
  align?: 'left' | 'center' | 'right'
  cropX?: number
  cropY?: number
  displayMode?: 'container' | 'wide' | 'full-bleed'
  mobileFullWidth?: boolean
  tabletFullWidth?: boolean
}

export const DEFAULT_LANDING_MEDIA_DISPLAY: Required<LandingMediaDisplay> = {
  aspectRatio: '3:2',
  widthPercent: 100,
  align: 'center',
  cropX: 50,
  cropY: 50,
  displayMode: 'container',
  mobileFullWidth: false,
  tabletFullWidth: false,
}

const ASPECT_VALUES: Record<Required<LandingMediaDisplay>['aspectRatio'], string> = {
  '3:2': '3 / 2',
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
}

export function normalizeLandingMediaDisplay(value: unknown): Required<LandingMediaDisplay> {
  const raw = value && typeof value === 'object' ? value as LandingMediaDisplay : {}
  const aspectRatio = raw.aspectRatio && raw.aspectRatio in ASPECT_VALUES ? raw.aspectRatio : DEFAULT_LANDING_MEDIA_DISPLAY.aspectRatio
  const displayMode = raw.displayMode === 'wide' || raw.displayMode === 'full-bleed' ? raw.displayMode : 'container'
  const maxWidth = displayMode === 'container' ? 100 : 160
  const widthPercent = Math.min(maxWidth, Math.max(40, Number(raw.widthPercent ?? 100) || 100))
  const align = raw.align === 'left' || raw.align === 'right' ? raw.align : 'center'
  const cropX = Math.min(100, Math.max(0, Number(raw.cropX ?? 50) || 0))
  const cropY = Math.min(100, Math.max(0, Number(raw.cropY ?? 50) || 0))
  const mobileFullWidth = raw.mobileFullWidth === true
  const tabletFullWidth = raw.tabletFullWidth === true
  return { aspectRatio, widthPercent, align, cropX, cropY, displayMode, mobileFullWidth, tabletFullWidth }
}

export function mediaFrameStyle(value: unknown): CSSProperties {
  const display = normalizeLandingMediaDisplay(value)
  const widthPercent = display.displayMode === 'container' ? Math.min(display.widthPercent, 100) : display.widthPercent
  const leftMargin = display.align === 'left'
    ? '0%'
    : display.align === 'right'
      ? `calc(100% - ${widthPercent}%)`
      : `calc((100% - ${widthPercent}%) / 2)`

  return {
    '--landing-media-width': `${widthPercent}%`,
    '--landing-media-margin-left': leftMargin,
    aspectRatio: ASPECT_VALUES[display.aspectRatio],
  } as CSSProperties
}

export function mediaFrameClassName(value: unknown, extra = ''): string {
  const display = normalizeLandingMediaDisplay(value)
  return [
    'landing-media-frame',
    display.mobileFullWidth ? 'landing-media-mobile-full' : '',
    display.tabletFullWidth ? 'landing-media-tablet-full' : '',
    display.displayMode === 'full-bleed' ? 'landing-media-desktop-full' : '',
    extra,
  ].filter(Boolean).join(' ')
}

export function mediaObjectStyle(value: unknown): CSSProperties {
  const display = normalizeLandingMediaDisplay(value)
  return { objectPosition: `${display.cropX}% ${display.cropY}%` }
}
