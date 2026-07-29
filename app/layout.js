import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'Sanjeevani — AI Health Triage Assistant',
  description:
    'Multilingual AI-powered health triage for rural & semi-urban India. Powered by MedGemma-27B. Speak or type in Hindi, Bhojpuri, Marathi — get immediate clinical guidance.',
  keywords: ['health triage', 'MedGemma', 'Hindi medical AI', 'rural health', 'Sanjeevani', 'emergency triage'],
  openGraph: {
    title: 'Sanjeevani — AI Health Triage',
    description: 'Multilingual clinical triage powered by MedGemma-27B',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-obsidian" data-theme='dark'>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-body text-slate-100 antialiased min-h-screen bg-obsidian`}
      >
        {children}
      </body>
    </html>
  );
}
