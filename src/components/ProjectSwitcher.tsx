import { useEffect, useRef, useState } from 'react'
import { useBrainstormStore } from '../store'

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentId = useBrainstormStore((s) => s.currentProjectId)
  const projects = useBrainstormStore((s) => s.projectsIndex)
  const newProject = useBrainstormStore((s) => s.newProject)
  const renameProject = useBrainstormStore((s) => s.renameProject)
  const deleteProject = useBrainstormStore((s) => s.deleteProject)
  const switchProject = useBrainstormStore((s) => s.switchProject)

  const current = projects.find((p) => p.id === currentId)
  const others = projects.filter((p) => p.id !== currentId)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setConfirmDelete(false)
        setRenaming(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const startRename = () => {
    if (!current) return
    setRenameValue(current.name)
    setRenaming(true)
  }

  const commitRename = () => {
    if (!current) return
    const next = renameValue.trim()
    if (next && next !== current.name) {
      renameProject(current.id, next)
    }
    setRenaming(false)
  }

  const handleDelete = () => {
    if (!current) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteProject(current.id)
    setConfirmDelete(false)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className="fixed top-4 left-4 z-40 flex flex-col gap-2 items-start"
    >
      <button
        onClick={() => {
          setOpen(!open)
          setConfirmDelete(false)
          setRenaming(false)
        }}
        className={`px-[14px] py-[6px] text-[12px] font-medium rounded-[10px] max-w-[240px] truncate transition-colors ${
          open
            ? 'bg-ink text-white'
            : 'bg-white text-ink hover:bg-chip'
        }`}
      >
        {current?.name ?? 'Untitled'}
      </button>

      {open && (
        <div className="bg-white rounded-[13px] p-[10px] w-[260px] flex flex-col gap-[6px] max-h-[70vh] overflow-y-auto">
          <div className="px-[4px] py-[2px]">
            <label className="text-[11px] text-ink/50 uppercase tracking-wider">
              Current
            </label>
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                className="mt-[2px] text-[13px] bg-surface-soft rounded-[6px] px-[8px] py-[5px] w-full outline-none text-ink"
              />
            ) : (
              <button
                onClick={startRename}
                className="mt-[2px] text-[13px] text-ink w-full text-left hover:underline underline-offset-2"
                title="Click to rename"
              >
                {current?.name ?? 'Untitled'}
              </button>
            )}
          </div>

          {others.length > 0 && (
            <>
              <div className="h-px bg-line-neutral/60 my-[2px]" />
              <label className="text-[11px] text-ink/50 uppercase tracking-wider px-[4px]">
                Other projects
              </label>
              <div className="flex flex-col gap-[2px]">
                {others.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProject(p.id)
                      setOpen(false)
                    }}
                    className="text-[13px] text-ink text-left px-[8px] py-[6px] rounded-[6px] hover:bg-chip transition-colors truncate"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="h-px bg-line-neutral/60 my-[2px]" />

          <button
            onClick={() => {
              newProject()
              setOpen(false)
            }}
            className="text-[13px] text-ink text-left px-[8px] py-[6px] rounded-[6px] hover:bg-chip transition-colors"
          >
            + New project
          </button>

          <button
            onClick={handleDelete}
            className={`text-[13px] text-left px-[8px] py-[6px] rounded-[6px] transition-colors ${
              confirmDelete
                ? 'bg-danger-soft text-danger'
                : 'text-ink/70 hover:bg-chip'
            }`}
          >
            {confirmDelete ? 'Click again to delete' : 'Delete project'}
          </button>
        </div>
      )}
    </div>
  )
}
