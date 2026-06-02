import AppLayout from '@/app/components/AppLayout'
import MatchesClient from './MatchesClient'

export const metadata = { title: 'AI Matches — Depop Scraper' }

export default function MatchesPage() {
  return (
    <AppLayout>
      <MatchesClient />
    </AppLayout>
  )
}
