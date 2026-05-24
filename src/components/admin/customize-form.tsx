'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { Check, MoreVertical, Pencil, RefreshCw, Save, Shuffle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  THEME_TOKENS,
  FONT_CHOICES,
  type ThemeTokens,
  type TokenSpec,
} from '@/lib/theme/tokens'
import {
  THEME_PRESETS,
  type ColorTokenKey,
  type ThemeMode,
  type ThemeDefaultKey,
} from '@/theme.config'
import { randomPalette } from '@/lib/theme/random'
import ColorPicker from './color-picker'
import ThemePreview from './theme-preview'

export interface SavedPreset {
  id: string
  name: string
  tokens: ThemeTokens
  created_at: string
  updated_at: string
}

interface Props {
  initial: ThemeTokens
  /** Resolved defaults for each mode — used to populate any tokens the admin hasn't customized. */
  defaults: Record<ThemeMode, Record<ThemeDefaultKey, string>>
  /** Admin-saved presets, fetched server-side. */
  savedPresets: SavedPreset[]
  /** True when the admin has an unpublished local preview active on page load. */
  hasLocalDraft: boolean
}

type SaveScope = 'global' | 'local'

/**
 * Customize page form. The admin picks a mode (light or dark) from the tabs
 * and edits the color tokens for that mode. Typography lives in its own
 * always-visible group (shared across modes). A live preview on the side
 * updates as the form changes.
 */
export default function CustomizeForm({ initial, defaults, savedPresets, hasLocalDraft }: Props) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [saving, setSaving] = useState<SaveScope | null>(null)
  const [discarding, setDiscarding] = useState(false)
  const [hasDraft, setHasDraft] = useState(hasLocalDraft)
  const [values, setValues] = useState<ThemeTokens>(initial)

  // Saved-preset state. `presets` is seeded from server-side fetch and
  // mutated locally after each API call so the UI updates immediately.
  const [presets, setPresets] = useState<SavedPreset[]>(savedPresets)
  const [saveNameOpen, setSaveNameOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const newPresetInputRef = useRef<HTMLInputElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (saveNameOpen) newPresetInputRef.current?.focus()
  }, [saveNameOpen])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  const duplicateName = useMemo(
    () =>
      saveNameOpen &&
      newPresetName.trim().length > 0 &&
      presets.some((p) => p.name.toLowerCase() === newPresetName.trim().toLowerCase()),
    [saveNameOpen, newPresetName, presets],
  )

  // Resolved (defaults merged with overrides) values for each mode.
  const resolvedLight = useMemo(
    () => resolveMode(values, 'light', defaults),
    [values, defaults],
  )
  const resolvedDark = useMemo(
    () => resolveMode(values, 'dark', defaults),
    [values, defaults],
  )
  const resolvedActive = mode === 'dark' ? resolvedDark : resolvedLight

  /** Update one color token in the currently-active mode. */
  function setColor(name: ColorTokenKey, next: string) {
    setValues((prev) => ({
      ...prev,
      [mode]: { ...(prev[mode] ?? {}), [name]: next },
    }))
  }

  /** Update one shared typography/size token. */
  function setShared(name: ThemeDefaultKey, next: string) {
    setValues((prev) => ({ ...prev, [name]: next }))
  }

  function resetToken(spec: TokenSpec) {
    if (spec.perMode) {
      const defaultVal = defaults[mode][spec.name]
      setColor(spec.name as ColorTokenKey, defaultVal)
    } else {
      const defaultVal = defaults.light[spec.name]
      setShared(spec.name, defaultVal)
    }
  }

  function resetAll() {
    setValues({})
  }

  function applyPreset(presetId: string) {
    const preset = THEME_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setValues((prev) => ({
      ...prev,
      light: { ...(preset.light ?? {}) },
      dark:  { ...(preset.dark  ?? {}) },
    }))
    toast.success(`Applied preset: ${preset.name}`)
  }

  function applyRandom() {
    const { light, dark } = randomPalette()
    setValues((prev) => ({ ...prev, light, dark }))
    toast.success('Random palette generated — Save to keep it.')
  }

  /** Applies a user-saved preset. Full overwrite — saved presets carry the
   *  whole snapshot (colors + typography), unlike built-in ones. */
  function applySavedPreset(preset: SavedPreset) {
    setValues({
      ...preset.tokens,
      light: { ...(preset.tokens.light ?? {}) },
      dark:  { ...(preset.tokens.dark  ?? {}) },
    })
    toast.success(`Applied preset: ${preset.name}`)
  }

  async function handleCreatePreset() {
    const name = newPresetName.trim()
    if (!name) return
    setSavingPreset(true)
    try {
      const res = await fetch('/api/theme/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tokens: values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not save preset.')
      setPresets((prev) => [data.preset as SavedPreset, ...prev])
      setSaveNameOpen(false)
      setNewPresetName('')
      toast.success(`Preset "${name}" saved.`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingPreset(false)
    }
  }

  async function handleRenamePreset(id: string) {
    const name = renameValue.trim()
    if (!name) {
      setRenamingId(null)
      return
    }
    const current = presets.find((p) => p.id === id)
    if (current && current.name === name) {
      setRenamingId(null)
      return
    }
    try {
      const res = await fetch(`/api/theme/presets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Rename failed.')
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: data.preset.name } : p)),
      )
      setRenamingId(null)
      toast.success('Preset renamed.')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleUpdatePresetTokens(preset: SavedPreset) {
    try {
      const res = await fetch(`/api/theme/presets/${preset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Update failed.')
      setPresets((prev) =>
        prev.map((p) => (p.id === preset.id ? (data.preset as SavedPreset) : p)),
      )
      toast.success(`"${preset.name}" updated to current values.`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDeletePreset(preset: SavedPreset) {
    if (!confirm(`Delete preset "${preset.name}"? This can't be undone.`)) return
    try {
      const res = await fetch(`/api/theme/presets/${preset.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Delete failed.')
      }
      setPresets((prev) => prev.filter((p) => p.id !== preset.id))
      toast.success(`Preset "${preset.name}" deleted.`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function saveTheme(scope: SaveScope) {
    setSaving(scope)

    const label = scope === 'global' ? 'Publishing theme' : 'Saving preview'
    const successMsg =
      scope === 'global'
        ? 'Theme published — reloading…'
        : 'Local preview saved — reloading…'

    const promise = fetch('/api/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: values, scope }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Could not save.')
      }
    })

    toast.promise(promise, {
      loading: `${label}…`,
      success: successMsg,
      error: (err: Error) => err.message,
    })

    try {
      await promise
      // Full reload — the root layout has to re-run for the new <style>
      // overrides to land in <head>; router.refresh() alone doesn't
      // re-evaluate <head>. Brief delay so the toast renders first.
      setTimeout(() => window.location.reload(), 450)
    } catch {
      // toast handles the user-facing error
    } finally {
      setSaving(null)
    }
  }

  async function discardLocalDraft() {
    if (!confirm('Discard your local preview and revert to the published theme?')) return
    setDiscarding(true)
    try {
      const res = await fetch('/api/theme', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Could not discard preview.')
      }
      setHasDraft(false)
      toast.success('Local preview discarded — reloading…')
      setTimeout(() => window.location.reload(), 450)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDiscarding(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    // The form has two explicit save buttons; pressing Enter inside an input
    // shouldn't accidentally publish. Default to local save on submit.
    e.preventDefault()
    saveTheme('local')
  }

  // Group token specs.
  const colorSpecs = THEME_TOKENS.filter((t) => t.perMode)
  const sharedSpecs = THEME_TOKENS.filter((t) => !t.perMode)
  const colorGroups = useMemo(() => groupSpecs(colorSpecs), [colorSpecs])
  const sharedGroups = useMemo(() => groupSpecs(sharedSpecs), [sharedSpecs])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {hasDraft && (
        <div className="rounded-2xl border border-warning-ring bg-warning-soft p-4 text-warning-foreground">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Local preview is active</p>
              <p className="mt-1 text-xs opacity-90">
                Only you see these changes while signed in. Visitors still see
                the published theme. Publish to make it live, or discard to revert.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveTheme('global')}
                disabled={saving !== null || discarding}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving === 'global' ? 'Publishing…' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={discardLocalDraft}
                disabled={saving !== null || discarding}
                className="rounded-lg border border-warning-ring bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background disabled:opacity-50"
              >
                {discarding ? 'Discarding…' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presets */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Presets
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One-click palette swaps. Click a preset, then Save to apply it everywhere.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyRandom}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Shuffle className="size-4" />
              Random
            </button>
            <button
              type="button"
              onClick={() => {
                setSaveNameOpen(true)
                setNewPresetName('')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Save className="size-4" />
              Save as preset
            </button>
          </div>
        </div>

        {/* Inline name input — appears when "Save as preset" is clicked. */}
        {saveNameOpen && (
          <div className="mt-4 rounded-xl border border-border bg-background p-3">
            <label
              htmlFor="new-preset-name"
              className="block text-xs font-medium text-muted-foreground"
            >
              Name this preset
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={newPresetInputRef}
                id="new-preset-name"
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreatePreset()
                  } else if (e.key === 'Escape') {
                    setSaveNameOpen(false)
                    setNewPresetName('')
                  }
                }}
                maxLength={60}
                placeholder="e.g. Holiday red, Soft mint"
                className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleCreatePreset}
                disabled={savingPreset || newPresetName.trim().length === 0}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPreset ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveNameOpen(false)
                  setNewPresetName('')
                }}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
            {duplicateName && (
              <p className="mt-2 text-xs text-warning-foreground">
                A preset with this name already exists — consider renaming for clarity.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Stores your current colors and typography. Apply later to restore this look.
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-colors hover:border-border-strong hover:bg-muted"
              title={preset.description}
            >
              <PresetSwatch preset={preset} />
              <span className="text-xs font-medium text-foreground">{preset.name}</span>
            </button>
          ))}
        </div>

        {presets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your presets
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {presets.map((preset) => (
                <SavedPresetCard
                  key={preset.id}
                  preset={preset}
                  isRenaming={renamingId === preset.id}
                  renameValue={renameValue}
                  renameInputRef={renameInputRef}
                  onApply={() => applySavedPreset(preset)}
                  onStartRename={() => {
                    setRenamingId(preset.id)
                    setRenameValue(preset.name)
                  }}
                  onCancelRename={() => setRenamingId(null)}
                  onRenameChange={setRenameValue}
                  onSubmitRename={() => handleRenamePreset(preset.id)}
                  onUpdateTokens={() => handleUpdatePresetTokens(preset)}
                  onDelete={() => handleDeletePreset(preset)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Side-by-side: form on the left, preview on the right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* Editor */}
        <div className="space-y-6">
          {/* Mode tabs */}
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(['light', 'dark'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  mode === m
                    ? 'flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                    : 'flex-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              >
                {m === 'light' ? 'Light mode' : 'Dark mode'}
              </button>
            ))}
          </div>

          {/* Color groups for the active mode */}
          {Object.entries(colorGroups).map(([group, tokens]) => (
            <section key={`${mode}-${group}`} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {tokens.map((spec) => (
                  <TokenRow
                    key={`${mode}-${spec.name}`}
                    spec={spec}
                    value={resolvedActive[spec.name]}
                    defaultValue={defaults[mode][spec.name]}
                    onChange={(v) => setColor(spec.name as ColorTokenKey, v)}
                    onReset={() => resetToken(spec)}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Shared typography */}
          {Object.entries(sharedGroups).map(([group, tokens]) => (
            <section key={`shared-${group}`} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-text-subtle">Shared</span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {tokens.map((spec) => (
                  <TokenRow
                    key={spec.name}
                    spec={spec}
                    value={resolvedActive[spec.name]}
                    defaultValue={defaults.light[spec.name]}
                    onChange={(v) => setShared(spec.name, v)}
                    onReset={() => resetToken(spec)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Sticky preview */}
        <div>
          <div className="sticky top-24 space-y-4">
            <ThemePreview resolved={resolvedActive} mode={mode} />
            <p className="text-xs text-muted-foreground">
              Preview reflects unsaved changes. The light/dark toggle in the header
              picks which mode visitors see.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <button
          type="button"
          onClick={resetAll}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Reset all
        </button>
        <button
          type="button"
          onClick={() => saveTheme('local')}
          disabled={saving !== null || discarding}
          title="Apply these changes to your own view only. Visitors continue to see the published theme."
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === 'local' ? 'Saving locally…' : 'Save locally'}
        </button>
        <button
          type="button"
          onClick={() => saveTheme('global')}
          disabled={saving !== null || discarding}
          title="Publish these changes to everyone."
          className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === 'global' ? 'Publishing…' : 'Save globally'}
        </button>
      </div>
    </form>
  )
}

/* ---------- helpers ---------- */

function groupSpecs(list: TokenSpec[]): Record<string, TokenSpec[]> {
  const out: Record<string, TokenSpec[]> = {}
  for (const t of list) {
    if (!out[t.group]) out[t.group] = []
    out[t.group].push(t)
  }
  return out
}

function resolveMode(
  values: ThemeTokens,
  mode: ThemeMode,
  defaults: Record<ThemeMode, Record<ThemeDefaultKey, string>>,
): Record<ThemeDefaultKey, string> {
  const out = { ...defaults[mode] }
  const colors = values[mode]
  if (colors) {
    for (const [name, val] of Object.entries(colors)) {
      if (val) out[name as ThemeDefaultKey] = val
    }
  }
  // Apply shared (top-level) typography overrides.
  for (const [name, val] of Object.entries(values)) {
    if (name === 'light' || name === 'dark') continue
    if (typeof val === 'string') out[name as ThemeDefaultKey] = val
  }
  return out
}

/* ---------- subcomponents ---------- */

interface RowProps {
  spec: TokenSpec
  value: string
  defaultValue: string
  onChange: (next: string) => void
  onReset: () => void
}

function TokenRow({ spec, value, defaultValue, onChange, onReset }: RowProps) {
  const isDefault = value === defaultValue
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`token-${spec.name}`} className="text-sm font-medium text-foreground">
          {spec.label}
        </label>
        {!isDefault && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
            title={`Reset to ${defaultValue}`}
          >
            Reset
          </button>
        )}
      </div>
      {spec.help && (
        <p className="text-xs text-muted-foreground">{spec.help}</p>
      )}

      {spec.kind === 'color' && (
        <div className="flex items-center gap-2">
          <ColorPicker value={value} onChange={onChange} ariaLabel={`${spec.label} color picker`} />
          <input
            id={`token-${spec.name}`}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="flex-1 rounded-md border border-input bg-background px-2 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      {spec.kind === 'font' && (
        <select
          id={`token-${spec.name}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {FONT_CHOICES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      )}

      {spec.kind === 'size' && (
        <input
          id={`token-${spec.name}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="e.g. 17px"
          className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  )
}

function PresetSwatch({ preset }: { preset: (typeof THEME_PRESETS)[number] }) {
  const lightBg = preset.light?.['background'] ?? 'oklch(1 0 0)'
  const lightPrimary = preset.light?.['primary'] ?? 'oklch(0.205 0 0)'
  const darkBg = preset.dark?.['background'] ?? 'oklch(0.17 0.003 240)'
  const darkPrimary = preset.dark?.['primary'] ?? 'oklch(0.92 0 0)'
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-lg ring-1 ring-border">
      <div className="flex w-1/2 items-center justify-center" style={{ backgroundColor: lightBg }}>
        <span className="block size-4 rounded-full" style={{ backgroundColor: lightPrimary }} />
      </div>
      <div className="flex w-1/2 items-center justify-center" style={{ backgroundColor: darkBg }}>
        <span className="block size-4 rounded-full" style={{ backgroundColor: darkPrimary }} />
      </div>
    </div>
  )
}

/** Same two-pane swatch as built-in presets, but reads from an arbitrary
 *  ThemeTokens shape and falls back to neutral defaults. */
function SavedSwatch({ tokens }: { tokens: ThemeTokens }) {
  const lightBg = tokens.light?.['background'] ?? 'oklch(1 0 0)'
  const lightPrimary = tokens.light?.['primary'] ?? 'oklch(0.205 0 0)'
  const darkBg = tokens.dark?.['background'] ?? 'oklch(0.17 0.003 240)'
  const darkPrimary = tokens.dark?.['primary'] ?? 'oklch(0.92 0 0)'
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-lg ring-1 ring-border">
      <div className="flex w-1/2 items-center justify-center" style={{ backgroundColor: lightBg }}>
        <span className="block size-4 rounded-full" style={{ backgroundColor: lightPrimary }} />
      </div>
      <div className="flex w-1/2 items-center justify-center" style={{ backgroundColor: darkBg }}>
        <span className="block size-4 rounded-full" style={{ backgroundColor: darkPrimary }} />
      </div>
    </div>
  )
}

interface SavedPresetCardProps {
  preset: SavedPreset
  isRenaming: boolean
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  onApply: () => void
  onStartRename: () => void
  onCancelRename: () => void
  onRenameChange: (next: string) => void
  onSubmitRename: () => void
  onUpdateTokens: () => void
  onDelete: () => void
}

function SavedPresetCard({
  preset,
  isRenaming,
  renameValue,
  renameInputRef,
  onApply,
  onStartRename,
  onCancelRename,
  onRenameChange,
  onSubmitRename,
  onUpdateTokens,
  onDelete,
}: SavedPresetCardProps) {
  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-colors hover:border-border-strong">
      <button
        type="button"
        onClick={onApply}
        title={`Apply "${preset.name}"`}
        className="flex w-full flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SavedSwatch tokens={preset.tokens} />
      </button>

      {isRenaming ? (
        <div className="flex w-full items-center gap-1">
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSubmitRename()
              } else if (e.key === 'Escape') {
                onCancelRename()
              }
            }}
            maxLength={60}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={onSubmitRename}
            aria-label="Save name"
            className="rounded-md p-1 text-success hover:bg-success-soft"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancelRename}
            aria-label="Cancel rename"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <span className="line-clamp-1 text-xs font-medium text-foreground">
          {preset.name}
        </span>
      )}

      {/* Actions menu — top-right corner. Hidden until hover/focus on desktop;
          always visible on touch for discoverability. */}
      {!isRenaming && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${preset.name}`}
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[180px] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
            >
              <DropdownMenu.Item
                onSelect={onStartRename}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
              >
                <Pencil className="size-3.5" />
                Rename
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onUpdateTokens}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Update to current values
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={onDelete}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive-soft"
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  )
}
