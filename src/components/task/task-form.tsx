'use client'

import { ChangeEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TaskForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File>()

  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user || error) {
      console.error('User not authenticated', error)
      return
    }

    let imageUrl: string | null = null

    if (file) {
      const filePath = `public/${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Image upload error:', uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from('task-images')
        .getPublicUrl(filePath)

      imageUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('tasks').insert({
      title,
      description,
      user_id: user.id,
      image_url: imageUrl
    })

    if (insertError) {
      console.error('Insert task error:', insertError.message)
      return
    }

    setTitle('')
    setDescription('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <input
        type="file"
        accept="image/*"
        className="text-sm mb-1"
        onChange={handleFileChange}
        required
      />
      <button type="submit">Add Task</button>
    </form>
  )
}
