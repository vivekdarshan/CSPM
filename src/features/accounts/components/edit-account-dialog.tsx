import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type CloudAccount } from '@/types/cspm'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAccount } from '@/lib/api/cspm-api'
import { ENVIRONMENT_LABELS } from '@/lib/aws'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RegionPicker } from './region-picker'

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name of at least 2 characters.')
    .max(40, 'Keep the name under 40 characters.'),
  environment: z.enum(['production', 'staging', 'development', 'shared']),
  regions: z.array(z.string()).min(1, 'Select at least one region.'),
})

type EditValues = z.infer<typeof editSchema>

type EditAccountDialogProps = {
  account: CloudAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: EditAccountDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      name: account.name,
      environment: account.environment,
      regions: account.regions,
    },
  })

  const save = useMutation({
    mutationFn: (values: EditValues) =>
      updateAccount(account.id, { ...values, name: values.name.trim() }),
    onSuccess: () => {
      toast.success('Account settings saved')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>
            Region changes apply from the next scan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='edit-account'
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className='space-y-5'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='environment'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ENVIRONMENT_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='regions'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regions to scan</FormLabel>
                  <FormControl>
                    <RegionPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='edit-account' disabled={save.isPending}>
            {save.isPending && <Loader2 className='animate-spin' />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
