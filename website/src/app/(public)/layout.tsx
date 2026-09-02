import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getSettings } from '@/lib/db'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <>
      <div style={{ backgroundColor: '#660C19', color: '#fff', textAlign: 'center', padding: '12px 16px', fontWeight: 'bold', fontSize: '15px', zIndex: 9999, position: 'relative', borderBottom: '2px solid #E5A823' }}>
        🕰️ ARCHIEF PREVIEW: Eerste functionele React/Next.js versie (7 juni 2026)
      </div>
      <Header
        alertActive={settings?.alert_active ?? false}
        alertMessage={settings?.alert_message ?? ''}
      />
      {children}
      <Footer
        contactEmail={settings?.contact_email}
        contactPhone={settings?.contact_phone}
        contactAddress={settings?.contact_address}
      />
      <button className="scroll-top-btn" id="scroll-top-btn" aria-label="Scroll naar boven">
        <i className="fa-solid fa-angles-up"></i>
      </button>
      <ScrollScript />
    </>
  )
}

function ScrollScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        // Laadscherm
        var ls = document.getElementById('loading-screen');
        if (ls) {
          if (sessionStorage.getItem('kriko_seen')) {
            ls.style.display = 'none';
          } else {
            sessionStorage.setItem('kriko_seen', '1');
          }
        }
        // Scroll-naar-boven knop
        var scrollBtn = document.getElementById('scroll-top-btn');
        if (scrollBtn) {
          window.addEventListener('scroll', function() {
            scrollBtn.classList.toggle('visible', window.scrollY > 400);
          }, { passive: true });
          scrollBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
        // Hamburger menu
        var hamburger = document.getElementById('nav-hamburger');
        var mainnav = document.getElementById('mainnav');
        if (hamburger && mainnav) {
          hamburger.addEventListener('click', function() {
            mainnav.classList.toggle('nav-open');
          });
        }
      })();
    ` }} />
  )
}
