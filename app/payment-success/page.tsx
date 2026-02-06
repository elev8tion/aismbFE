'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslations } from '@/contexts/LanguageContext';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SessionData {
  id: string;
  status: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  metadata: Record<string, string>;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="page-content flex items-center justify-center min-h-[60vh]">
          <p className="text-white/60">Loading...</p>
        </div>
      </DashboardLayout>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetch(`/api/integrations/stripe/session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data);
          // Record payment in NCB if paid (user is authenticated here)
          if (data.payment_status === 'paid') {
            fetch('/api/data/create/payments', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'setup',
                amount: data.amount_total ? data.amount_total / 100 : 0,
                due_date: new Date().toISOString().split('T')[0],
                paid_date: new Date().toISOString().split('T')[0],
                status: 'paid',
                stripe_session_id: data.id,
                customer_email: data.customer_email || '',
                opportunity_id: data.metadata?.opportunity_id ? Number(data.metadata.opportunity_id) : null,
                partnership_id: data.metadata?.partnership_id ? Number(data.metadata.partnership_id) : null,
              }),
            }).catch(err => console.error('Failed to record payment:', err));
          }
        }
      })
      .catch(() => setError('Failed to load payment details'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const isPaid = session?.payment_status === 'paid';
  const amountDisplay = session?.amount_total
    ? `$${(session.amount_total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : null;
  const fromPartnership = session?.metadata?.partnership_id;

  return (
    <DashboardLayout>
      <div className="page-content flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-lg w-full text-center p-8 md:p-12">
          {loading ? (
            <p className="text-white/60">{t.payments.processing}</p>
          ) : error ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-functional-error/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-functional-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{t.payments.paymentFailed}</h1>
              <p className="text-white/60 mb-6">{error}</p>
              <Link href="/pipeline" className="btn-primary inline-block">{t.payments.backToPipeline}</Link>
            </>
          ) : isPaid ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-functional-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-functional-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{t.payments.paymentSuccess}</h1>
              <p className="text-white/60 mb-6">{t.payments.thankYou}</p>

              {amountDisplay && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-xs text-white/50 mb-1">{t.payments.amount}</p>
                  <p className="text-3xl font-bold text-functional-success">{amountDisplay}</p>
                  {session.customer_email && (
                    <p className="text-xs text-white/40 mt-2">{session.customer_email}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-white/50 mb-6">{t.payments.receiptNote}</p>

              <div className="bg-white/5 rounded-xl p-4 mb-8 text-left">
                <h3 className="text-sm font-medium text-white mb-3">{t.payments.nextSteps}</h3>
                <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
                  <li>Check your email for the payment receipt</li>
                  <li>Your account manager will reach out within 24 hours</li>
                  <li>Onboarding begins once your systems are scheduled</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={fromPartnership ? '/partnerships' : '/pipeline'} className="btn-secondary">
                  {fromPartnership ? t.payments.backToPartnerships : t.payments.backToPipeline}
                </Link>
                <Link href="/dashboard" className="btn-primary">
                  {t.payments.viewDashboard}
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-functional-warning/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-functional-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{t.payments.processing}</h1>
              <p className="text-white/60 mb-6">{t.payments.paymentReceived}</p>
              <Link href="/pipeline" className="btn-primary inline-block">{t.payments.backToPipeline}</Link>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
