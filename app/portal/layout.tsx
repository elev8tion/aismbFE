import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Portal | KRE8TION',
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
