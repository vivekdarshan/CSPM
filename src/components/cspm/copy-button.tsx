import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CopyButtonProps = {
  value: string
  /** What is being copied, for the screen-reader label and toast */
  label: string
  className?: string
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('size-7 shrink-0', className)}
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className='text-success size-3.5' />
      ) : (
        <Copy className='size-3.5' />
      )}
    </Button>
  )
}

type CopyFieldProps = {
  label: string
  value: string
  mono?: boolean
}

/** Read-only labelled value with a copy button. */
export function CopyField({ label, value, mono = true }: CopyFieldProps) {
  return (
    <div className='space-y-1'>
      <div className='text-muted-foreground text-xs font-medium'>{label}</div>
      <div className='bg-muted/50 flex items-center gap-2 rounded-md border py-1 ps-3 pe-1'>
        <span
          className={cn('min-w-0 flex-1 truncate text-sm', mono && 'font-mono')}
          title={value}
        >
          {value}
        </span>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  )
}
