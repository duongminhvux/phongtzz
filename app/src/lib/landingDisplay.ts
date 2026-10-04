import type { CSSProperties } from 'react'

export type LandingMediaDisplay = {
  aspectRatio?: '3:2' | '1:1' | '4:5' | '16:9'
  widthPercent?: number
  align?: 'left' | 'center' | 'right'
  cropX?: number
  cropY?: number
}

export const DEFAULT_LANDING_MEDIA_DISPLAY: Required<LandingMediaDisplay> = {
  aspectRatio: '3:2',
  widthPercent: 100,
  align: 'center',
  cropX: 50,
  cropY: 50,
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
  const widthPercent = Math.min(100, Math.max(40, Number(raw.widthPercent ?? 100) || 100))
  const align = raw.align === 'left' || raw.align === 'right' ? raw.align : 'center'
  const cropX = Math.min(100, Math.max(0, Number(raw.cropX ?? 50) || 0))
  const cropY = Math.min(100, Math.max(0, Number(raw.cropY ?? 50) || 0))
  return { aspectRatio, widthPercent, align, cropX, cropY }
}

export function mediaFrameStyle(value: unknown): CSSProperties {
  const display = normalizeLandingMediaDisplay(value)
  const marginLeft = display.align === 'left' ? 0 : 'auto'
  const marginRight = display.align === 'right' ? 0 : 'auto'
  return {
    '--landing-media-width': `${display.widthPercent}%`,
    aspectRatio: ASPECT_VALUES[display.aspectRatio],
    marginLeft,
    marginRight,
  } as CSSProperties
}

export function mediaObjectStyle(value: unknown): CSSProperties {
  const display = normalizeLandingMediaDisplay(value)
  return { objectPosition: `${display.cropX}% ${display.cropY}%` }
}
