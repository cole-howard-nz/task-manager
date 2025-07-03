export type Task = {
  id: string
  user_id: string
  title: string
  description?: string
  is_complete: boolean
  created_at: string
  image_url?: string
}