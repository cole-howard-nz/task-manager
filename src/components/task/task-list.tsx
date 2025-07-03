'use client'

import { Task } from '@/types/task'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [editMode, setEditMode] = useState<string>()
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedIsComplete, setEditedIsComplete] = useState(false)
  const [editedImageUrl, setEditedImageUrl] = useState('')
  const [editedFile, setEditedFile] = useState<File>()

  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditedFile(e.target.files[0])
    }
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    router.refresh()
  }

  const editTask = async (id: string) => {
    let imageUrl = editedImageUrl
    let oldImagePath: string | null = null

    if (editedImageUrl) {
      const urlParts = editedImageUrl.split('/object/public/task-images/')
      oldImagePath = urlParts[1] || null
    }

    if (editedFile) {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!user || error) {
        console.error('User not authenticated', error)
        return
      }

      const filePath = `public/${user.id}/${Date.now()}-${editedFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(filePath, editedFile, { upsert: true })

      if (uploadError) {
        console.error('Image upload error:', uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage.from('task-images').getPublicUrl(filePath)
      imageUrl = urlData.publicUrl

      console.log('YOAMMAA',oldImagePath)
      if (oldImagePath) {
        const { error: deleteError } = await supabase.storage
          .from('task-images')
          .remove([oldImagePath])
        if (deleteError) {
          console.warn('Could not delete old image:', deleteError.message)
        }
      }
    }

    await supabase.from('tasks').update({
      title: editedTitle,
      description: editedDescription,
      is_complete: editedIsComplete,
      image_url: imageUrl
    }).eq('id', id)

    setEditMode(undefined)
    router.refresh()
  }

  const toggleEditMode = (index: number, id: string) => {
    if (editMode === id) {
      setEditMode(undefined)
    } else {
      setEditMode(id)
      setEditedTitle(tasks[index].title)
      setEditedDescription(tasks[index].description || '')
      setEditedIsComplete(tasks[index].is_complete || false)
      setEditedImageUrl(tasks[index].image_url || '')
      setEditedFile(undefined)
    }
  }

  return (
    <ul>
      {tasks.map( (task: Task, index: number) => (
        <li key={task.id}>
          { editMode === task.id ? 
          <>
            <input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              required
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
            <input
              type='checkbox'
              checked={editedIsComplete}
              onChange={(e) => setEditedIsComplete(e.target.checked)}
              required
            />
            <input
              type="file"
              accept="image/*"
              className="text-sm mb-1"
              onChange={ handleFileChange }
              required
            />
            <button onClick={() => toggleEditMode(index, task.id)}>Go back</button>
            <button onClick={() => editTask(task.id)}>Save</button>
          </> 
          :
          <>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            {task.is_complete ? <p>Complete</p> : <p>Incomplete</p>}
            <img className='w-16' src={task.image_url || ''} />
            <button onClick={() => toggleEditMode(index, task.id)}>Edit</button>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </> 
          }
        </li>
      ))}
    </ul>
  )
}
