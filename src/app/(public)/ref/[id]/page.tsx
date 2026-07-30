import { redirect } from 'next/navigation'
import { getDocByField } from '@/lib/db'

export async function generateStaticParams() {
  return [{ id: '__dynamic__' }]
}

export default async function RefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  if (id === '__dynamic__') return null
  
  // Store the referral in a cookie and redirect to home
  // The cookie will be read during registration to attribute the referral
  redirect(`/?ref=${id}`)
}
