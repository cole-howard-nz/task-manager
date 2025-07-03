import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/log-out-button'
import TaskPage from '@/components/task/task-page'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <>
      <div>
        <p>Hello {data.user.email}</p>
        <LogoutButton/>
      </div>

      <TaskPage />
    </>
  )
}