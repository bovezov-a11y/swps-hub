import { z } from 'zod'
import { materialTypeOrder } from '../../lib/academic'

export const MAX_FILE_SIZE = 25 * 1024 * 1024

/** Same list as the backend; anything else is rejected there too. */
export const ACCEPTED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'md', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip',
]

export const materialSchema = z.object({
  file: z
    .instanceof(File, { error: 'Choose a file to upload' })
    .refine((file) => file.size <= MAX_FILE_SIZE, { error: 'Files can be at most 25 MB' })
    .refine((file) => ACCEPTED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() ?? ''), {
      error: 'Use PDF, an image, an Office document, text or ZIP',
    }),
  type: z.enum(materialTypeOrder),
  title: z.string().trim().min(1, { error: 'Enter a title' }).max(200, { error: 'Use at most 200 characters' }),
  academicYear: z.string().regex(/^\d{4}\/\d{2}$/, { error: 'Choose a year' }),
  description: z.string().trim().max(2000, { error: 'Use at most 2000 characters' }),
})

export type MaterialFormValues = z.infer<typeof materialSchema>
