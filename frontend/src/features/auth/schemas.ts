import { z } from 'zod'

const email = z.string().trim().pipe(z.email({ error: 'Enter a valid email address' }))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Enter your password' }),
})

/** Same list as the backend: only university addresses can sign up. */
export const universityDomains = ['st.swps.edu.pl', 'swps.edu.pl']

const universityEmail = email.refine(
  (value) => universityDomains.includes(value.split('@').pop()?.toLowerCase() ?? ''),
  { error: `Use your SWPS university email (@${universityDomains[0]})` },
)

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Enter your name' })
    .max(100, { error: 'Name can be at most 100 characters' }),
  email: universityEmail,
  password: z
    .string()
    .min(8, { error: 'Use at least 8 characters' })
    .max(72, { error: 'Use at most 72 characters' }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
