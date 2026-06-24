'use client'
import { useState, useTransition } from 'react'
import { updateRosterEntry } from './actions'

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
}

interface Props {
  employeeId: string
  employeeName: string
  date: string
  entryId: string | null
  currentStatus: 'work' | 'off' | 'leave'
  currentShiftId: string | null
  shifts: Shift[]
  rosterId: string | null
}

export default function EditEntryButton(props: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'work' | 'off'>(
    props.currentStatus === 'leave' ? 'work' : (props.currentStatus as 'work' | 'off')
  )
  const [shiftId, setShiftId] = useState(props.currentShiftId ?? props.shifts[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()

  const isLeave = props.currentStatus === 'leave'

  function handleOpen() {
    setStatus(isLeave ? 'work' : (props.currentStatus as 'work' | 'off'))
    setShiftId(props.currentShiftId ?? props.shifts[0]?.id ?? '')
    setOpen(true)
  }

  function handleSave() {
    startTransition(async () => {
      await updateRosterEntry({
        entryId: props.entryId,
        employeeId: props.employeeId,
        date: props.date,
        status,
        shiftId: status === 'work' ? shiftId : null,
        rosterId: props.rosterId,
      })
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 px-2 py-0.5 rounded bg-white border border-indigo-100 hover:border-indigo-300 transition"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-80 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-900 text-base">{props.employeeName}</h3>
            <p className="text-xs text-slate-400 mb-4 mt-0.5">
              {new Date(props.date + 'T00:00:00').toLocaleDateString('en', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>

            {isLeave && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4 text-xs text-orange-700">
                This employee has an approved leave on this date. Manage it from the Leave section.
              </div>
            )}

            {!isLeave && (
              <div className="space-y-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'work'}
                    onChange={() => setStatus('work')}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Working</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'off'}
                    onChange={() => setStatus('off')}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Day Off / Sick / Emergency</span>
                </label>
              </div>
            )}

            {!isLeave && status === 'work' && (
              <div className="mb-5">
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Shift</label>
                <select
                  value={shiftId}
                  onChange={e => setShiftId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {props.shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                    </option>
                  ))}
                </select>
                {!props.rosterId && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    No generated roster for this period. Generate a roster first to enable edits.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || isLeave || (status === 'work' && !props.rosterId)}
                className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
