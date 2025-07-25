import { useId } from "react"

import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

export default function Component() {
  const id = useId()
  return (
    <>
      <div className="[--ring:var(--color-indigo-300)] *:not-first:mt-2 in-[.dark]:[--ring:var(--color-indigo-900)]">
        <Label htmlFor={id}>Input with colored border and ring</Label>
        <Input id={id} placeholder="Email" type="email" />
      </div>
    </>
  )
}
