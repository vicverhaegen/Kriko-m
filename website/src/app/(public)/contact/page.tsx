import type { Metadata } from 'next'
import { getSettings } from '@/lib/db'
import ContactForm from './ContactForm'
import ProtectedEmail from '@/components/anti-scraping/ProtectedEmail'
import ContactGroepsleidingCard from './ContactGroepsleidingCard'
import EditableText from '@/components/editing/EditableText'
import { Leader } from '@/lib/types'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const settings = await getSettings()

  const groepsleidingLeaders: Leader[] = settings?.takken?.groepsleiding?.leaders ?? []
  const groepsleidingPhoto = settings?.takken?.groepsleiding?.photo ?? null

  return (
    <>
      <section className="tak-hero primair hero-contact">
        <div className="container">
          <EditableText
            blockKey="contact.hero.title"
            page="contact"
            section="hero"
            field="title"
            defaultValue="Contact"
            as="h1"
            className="tak-hero-title"
          />
        </div>
      </section>

      <section className="section container section--no-top">
        <div className="contact-page-grid">

          <div style={{ background: 'var(--color-bg-white)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-md)', padding: 40, border: '1px solid var(--color-border)' }}>
            <EditableText
              blockKey="contact.form.title"
              page="contact"
              section="form"
              field="title"
              defaultValue="Stuur ons een berichtje"
              as="h2"
              style={{ marginBottom: 8 }}
            />
            <EditableText
              blockKey="contact.form.sub"
              page="contact"
              section="form"
              defaultValue="We antwoorden normaal binnen de 2 werkdagen."
              as="p"
              style={{ color: 'var(--color-text-muted)', marginBottom: 28 }}
            />
            <ContactForm />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="side-card">
              <EditableText
                blockKey="contact.sidebar.title"
                page="contact"
                section="sidebar"
                field="title"
                defaultValue="Contactgegevens"
                as="h3"
              />
              <ul className="contact-sidebar-list" style={{ marginTop: 16 }}>
                <li className="contact-sidebar-item">
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>E-mail</span>
                  <ProtectedEmail
                    email={settings?.contact_email ?? 'groepsleiding@kriko-m.be'}
                    showCopy
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  />
                </li>
                <li className="contact-sidebar-item">
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Adres</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.contact_address ?? '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600, color: 'var(--color-primary)', textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    className="address-map-link"
                  >
                    {settings?.contact_address} <i className="fa-solid fa-map-location-dot" style={{ fontSize: '0.85em', opacity: 0.7 }}></i>
                  </a>
                </li>
              </ul>
            </div>

            <ContactGroepsleidingCard
              initialLeaders={groepsleidingLeaders}
              initialPhoto={groepsleidingPhoto}
            />
          </div>

        </div>
      </section>
    </>
  )
}
