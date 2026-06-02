import AppLayout from '@/app/components/AppLayout'
import ListingsClient from './ListingsClient'

export const metadata = { title: 'All Listings — Depop Scraper' }

export default function ListingsPage() {
  return (
    <AppLayout>
      <ListingsClient />
    </AppLayout>
  )
}
