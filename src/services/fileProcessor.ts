export interface ProcessedFile {
  name: string
  type: 'pdf' | 'image' | 'video' | 'text'
  content: string // base64 or text content
  textContent?: string // extracted text for PDFs
  preview?: string
  size: number
  mimeType: string
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const fileType = getFileType(file)

  switch (fileType) {
    case 'pdf':
      return processPdf(file)
    case 'image':
      return processImage(file)
    case 'video':
      return processVideo(file)
    case 'text':
      return processTextFile(file)
    default:
      throw new Error(`Unsupported file type: ${file.type}`)
  }
}

function getFileType(file: File): 'pdf' | 'image' | 'video' | 'text' {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'text/plain' || file.type === 'text/markdown') return 'text'
  throw new Error(`Unsupported file type: ${file.type}`)
}

async function processPdf(file: File): Promise<ProcessedFile> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  // Try to extract text (basic implementation)
  let textContent = ''
  try {
    const pdfModule = await (window as any).pdfjsLib?.getDocument?.({ data: arrayBuffer })
    if (pdfModule) {
      const pdf = pdfModule
      const maxPages = Math.min(pdf.numPages, 3) // Limit to first 3 pages
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        textContent += content.items.map((item: any) => item.str).join(' ') + '\n'
      }
    }
  } catch {
    // PDF.js not available, skip text extraction
  }

  return {
    name: file.name,
    type: 'pdf',
    content: base64,
    textContent: textContent || `[PDF] ${file.name}`,
    size: file.size,
    mimeType: 'application/pdf',
    preview: `📄 ${file.name} (${formatFileSize(file.size)})`,
  }
}

async function processImage(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1]

      // Create preview
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        resolve({
          name: file.name,
          type: 'image',
          content: base64,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
          preview: e.target?.result as string,
        })
      }
      img.onerror = () => {
        resolve({
          name: file.name,
          type: 'image',
          content: base64,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
          preview: `🖼️ ${file.name}`,
        })
      }
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function processVideo(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1]

      // Extract first frame as preview
      const video = document.createElement('video')
      video.src = e.target?.result as string
      video.onloadedmetadata = () => {
        video.currentTime = 0
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0)
            const preview = canvas.toDataURL()
            resolve({
              name: file.name,
              type: 'video',
              content: base64,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              preview,
            })
          } else {
            resolve({
              name: file.name,
              type: 'video',
              content: base64,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              preview: `🎥 ${file.name}`,
            })
          }
        }
      }
      video.onerror = () => {
        resolve({
          name: file.name,
          type: 'video',
          content: base64,
          size: file.size,
          mimeType: file.type || 'video/mp4',
          preview: `🎥 ${file.name}`,
        })
      }
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function processTextFile(file: File): Promise<ProcessedFile> {
  const text = await file.text()
  return {
    name: file.name,
    type: 'text',
    content: text,
    size: file.size,
    mimeType: file.type || 'text/plain',
    preview: text.substring(0, 200),
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
