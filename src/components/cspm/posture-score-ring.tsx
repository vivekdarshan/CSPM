import { postureGrade } from '@/lib/posture'
import { cn } from '@/lib/utils'

type PostureScoreRingProps = {
  score: number
  size?: number
  className?: string
}

/** Circular 0-100 gauge. The grade label beneath carries the meaning in text. */
export function PostureScoreRing({
  score,
  size = 148,
  className,
}: PostureScoreRingProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const grade = postureGrade(clamped)

  return (
    <div
      className={cn('relative inline-flex', className)}
      style={{ width: size, height: size }}
      role='meter'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={`Posture score ${clamped} out of 100, ${grade.label}`}
    >
      <svg width={size} height={size} className='-rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          className='stroke-muted'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          strokeLinecap='round'
          stroke='currentColor'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn(
            'transition-[stroke-dashoffset] duration-700',
            grade.className
          )}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-4xl font-bold tabular-nums'>{clamped}</span>
        <span className='text-muted-foreground text-xs'>out of 100</span>
      </div>
    </div>
  )
}
