import { apiBlob } from '../../lib/api'
import type { Material } from '../../lib/types'

export const isPreviewable = (material: Material) =>
  material.contentType === 'application/pdf' || material.contentType.startsWith('image/')

/**
 * Opens PDFs and images in a new tab and downloads everything else. The tab is opened before the download starts
 * because browsers only allow pop-ups that come straight from a click.
 */
export async function openMaterial(material: Material) {
  const tab = isPreviewable(material) ? window.open('', '_blank') : null
  try {
    const blob = await apiBlob(`/materials/${material.id}/file`)
    const url = URL.createObjectURL(new Blob([blob], { type: material.contentType }))
    if (tab) {
      tab.location.href = url
    } else {
      const link = document.createElement('a')
      link.href = url
      link.download = material.fileName
      link.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    tab?.close()
    throw error
  }
}
