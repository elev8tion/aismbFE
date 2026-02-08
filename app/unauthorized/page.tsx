'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { signOut } = useAuth();
  const { t } = useTranslations();
  const router = useRouter();

  const handleBackToLogin = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logos/dark_mode_brand.svg"
            alt="ELEV8TION"
            className="h-28 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">KRE8TION</h1>
        </div>

        {/* Card */}
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white mb-3">
            {t.unauthorized}
          </h2>
          <p className="text-white/60 text-sm mb-8">
            {t.unauthorizedMessage}
          </p>

          <button
            onClick={handleBackToLogin}
            className="btn-primary w-full"
          >
            {t.backToLogin}
          </button>
        </div>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <a
            href="https://kre8tion.com"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            &larr; {t.common.backTo}
          </a>
        </div>
      </div>
    </div>
  );
}
