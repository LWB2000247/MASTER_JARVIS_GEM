export interface ProcessedFile {
  name: string
  type: 'pdf' | 'image' | 'video' | 'text'
  content: string
  preview?: string
  size: number
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

  return {
    name: file.name,
    type: 'pdf',
    content: `[PDF Content - Base64 encoded]\n${base64.substring(0, 500)}...`,
    size: file.size,
    preview: `PDF: ${file.name} (${formatFileSize(file.size)})`,
  }
}

async function processImage(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      resolve({
        name: file.name,
        type: 'image',
        content: dataUrl,
        preview: dataUrl,
        size: file.size,
      })
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function processVideo(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      resolve({
        name: file.name,
        type: 'video',
        content: dataUrl,
        preview: `Video: ${file.name}`,
        size: file.size,
      })
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
