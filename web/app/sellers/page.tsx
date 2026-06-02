import AppLayout from '@/app/components/AppLayout'
import SellersClient from './SellersClient'

export const metadata = { title: 'Top Sellers — Depop Scraper' }

export default function SellersPage() {
  return (
    <AppLayout>
      <SellersClient />
    </AppLayout>
  )
}
