import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskForm from './task-form'
import TaskList from './task-list'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1>Your Tasks</h1>
      <TaskForm />
      <TaskList tasks={tasks || []} />
    </div>
  )
}
