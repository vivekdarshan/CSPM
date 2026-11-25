import { AWS_REGIONS } from '@/lib/aws'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type RegionPickerProps = {
  value: string[]
  onChange: (regions: string[]) => void
  id?: string
}

/** Checkbox grid of AWS regions. */
export function RegionPicker({ value, onChange, id }: RegionPickerProps) {
  const selected = new Set(value)
  const toggle = (code: string, on: boolean) => {
    const next = new Set(selected)
    if (on) next.add(code)
    else next.delete(code)
    // Keep the canonical region order
    onChange(AWS_REGIONS.map((r) => r.code).filter((c) => next.has(c)))
  }

  return (
    <div id={id} className='space-y-2'>
      <div className='flex items-center gap-2 text-xs'>
        <span className='text-muted-foreground'>
          {value.length} of {AWS_REGIONS.length} selected
        </span>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0 text-xs'
          onClick={() => onChange(AWS_REGIONS.map((r) => r.code))}
        >
          Select all
        </Button>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0 text-xs'
          onClick={() => onChange([])}
        >
          Clear
        </Button>
      </div>
      <div className='grid max-h-64 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2'>
        {AWS_REGIONS.map((r) => (
          <label
            key={r.code}
            className='hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm'
          >
            <Checkbox
              checked={selected.has(r.code)}
              onCheckedChange={(on) => toggle(r.code, on === true)}
            />
            <span className='min-w-0'>
              <span className='block truncate'>{r.name}</span>
              <span className='text-muted-foreground block font-mono text-xs'>
                {r.code}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
