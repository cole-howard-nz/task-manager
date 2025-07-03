'use client'

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    redirect('/')
  }

  return <button onClick={ handleLogOut }>Log out</button>
}
