import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Disclaimer } from '../components/Disclaimer'
import { Logo } from '../components/Logo'
import { privacyPolicy } from '../content/privacy-policy'

/** Public page, readable before signing up. */
export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[radial-gradient(60rem_30rem_at_50%_-10rem,rgb(99_102_241/0.09),transparent)]">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="SWPS Hub home">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
        <div className="card p-6 sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">
            Version {privacyPolicy.version} · Last updated {privacyPolicy.lastUpdated}
          </p>

          <div className="mt-8 space-y-8">
            {privacyPolicy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2 leading-relaxed text-slate-700">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700 marker:text-indigo-400">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
            Project page and contact:{' '}
            <a
              href={privacyPolicy.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {privacyPolicy.repositoryUrl.replace('https://', '')}
            </a>
          </p>
        </div>
        <Disclaimer className="mt-6 text-center text-slate-400" />
      </main>
    </div>
  )
}
