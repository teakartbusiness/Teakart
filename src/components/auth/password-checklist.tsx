import { Check, Circle } from 'lucide-react'
import { passwordChecklist } from '@/lib/password'

interface Props {
  password: string
}

/**
 * Small live checklist below the password field — each requirement lights
 * up as the user types. Helps users hit the policy on the first try without
 * being yelled at by the server after submit.
 */
export default function PasswordChecklist({ password }: Props) {
  const checks = passwordChecklist(password)

  return (
    <ul className="mt-2 space-y-1">
      {checks.map(({ label, met }) => (
        <li key={label} className="flex items-center gap-2 text-xs">
          {met ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Circle className="size-3 text-text-subtle" />
          )}
          <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}
