import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartProvider from '@/components/shop/CartProvider'
import ScrollRestorer from '@/components/ScrollRestorer'
import ScrollTopButton from '@/components/ScrollTopButton'
import EditModeBar from '@/components/editing/EditModeBar'
import { EditProvider } from '@/components/editing/EditContext'
import ContentLinkInterceptor from '@/components/editing/ContentLinkInterceptor'
import { getSettings, getSiteContent } from '@/lib/db'

export const revalidate = 86400 // 24 uur ISR cache voor publieke pagina's

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, siteContent] = await Promise.all([
    getSettings(),
    getSiteContent(),
  ])

  return (
    <EditProvider initialContent={siteContent}>
      <CartProvider>
        <ScrollRestorer />
        <Suspense fallback={null}>
          <EditModeBar />
        </Suspense>
        <Header />
        <ContentLinkInterceptor>
          {children}
        </ContentLinkInterceptor>
        <Footer
          contactEmail={settings?.contact_email}
          contactAddress={settings?.contact_address}
        />
        <ScrollTopButton />
      </CartProvider>
    </EditProvider>
  )
}
