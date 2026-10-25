import { Lock, MapPin, Plus, Trash2, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { CardGridSkeleton } from '../../components/Skeleton'
import type { CourseDetail } from '../../lib/types'
import { useCreateGroup, useDeleteGroup, useGroupMembership, useGroups, type StudyGroup } from './api'

export function GroupsSection({ course }: { course: CourseDetail }) {
  const groups = useGroups(course.id)
  const [creating, setCreating] = useState(false)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex max-w-xl items-start gap-2 text-sm text-slate-600">
          <Lock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
          Members see each other’s names and where the group meets. Everyone else only sees how full it is.
        </p>
        {course.enrolled && !creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Start a group
          </Button>
        )}
      </div>

      {creating && <CreateGroupForm courseId={course.id} onDone={() => setCreating(false)} />}

      <div className="mt-6">
        {groups.isPending ? (
          <CardGridSkeleton count={2} />
        ) : groups.isError ? (
          <ErrorState text="Could not load study groups." />
        ) : groups.data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No study groups yet"
            text={course.enrolled ? 'Start one and invite classmates to revise together.' : 'Join the course to start or join a study group.'}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.data.map((group) => (
              <GroupCard key={group.id} group={group} courseId={course.id} canJoin={course.enrolled} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function GroupCard({ group, courseId, canJoin }: { group: StudyGroup; courseId: string; canJoin: boolean }) {
  const membership = useGroupMembership(courseId)
  const remove = useDeleteGroup(courseId)
  const full = group.memberCount >= group.capacity

  return (
    <li className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{group.name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${full ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {group.memberCount}/{group.capacity}
        </span>
      </div>
      {group.description && <p className="mt-1 text-sm text-slate-600">{group.description}</p>}
      <div className="mt-2 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(group.memberCount / group.capacity) * 100}%` }} />
      </div>

      {group.member && (
        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
          {group.meetingDetails && (
            <p className="flex items-start gap-2 text-slate-700">
              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              {group.meetingDetails}
            </p>
          )}
          <p className="flex items-start gap-2 text-slate-700">
            <Users className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
            {group.members.join(', ')}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {group.member ? (
          <Button size="sm" variant="secondary" isLoading={membership.isPending} onClick={() => membership.mutate({ groupId: group.id, join: false })}>
            Leave group
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!canJoin || full}
            isLoading={membership.isPending}
            onClick={() => membership.mutate({ groupId: group.id, join: true })}
          >
            {full ? 'Full' : 'Join group'}
          </Button>
        )}
        {group.canDelete && (
          <button
            type="button"
            onClick={() => window.confirm(`Delete "${group.name}"?`) && remove.mutate(group.id)}
            aria-label={`Delete ${group.name}`}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {membership.isError && <p className="mt-2 text-sm text-red-600">{membership.error.message}</p>}
    </li>
  )
}

function CreateGroupForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const create = useCreateGroup(courseId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [meetingDetails, setMeetingDetails] = useState('')
  const [capacity, setCapacity] = useState(6)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate({ name: name.trim(), description, meetingDetails, capacity }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm" aria-label="Start a study group">
      <h3 className="font-semibold">Start a study group</h3>
      {create.isError && <FormAlert message={create.error.message} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <TextField label="Name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Midterm prep" />
        <TextField label="Places" type="number" min={2} max={50} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} />
      </div>
      <TextAreaField label="What the group does (optional)" rows={2} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
      <TextField
        label="When and where (optional)"
        maxLength={300}
        value={meetingDetails}
        onChange={(event) => setMeetingDetails(event.target.value)}
        placeholder="Library room 2, Thursdays 17:00, or an online link"
        hint="Only members will see this."
      />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={create.isPending} disabled={!name.trim()}>
          Create group
        </Button>
      </div>
    </form>
  )
}
