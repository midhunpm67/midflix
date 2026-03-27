import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerUser } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate('/subscription')
    },
  })

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-5xl tracking-[0.2em] text-white uppercase">
          MidFlix
        </h1>
        <p className="text-sm text-muted">Create your account</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            {...register('name')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            {...register('password')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-xs uppercase tracking-widest text-muted">
            Confirm Password
          </Label>
          <Input
            id="password_confirmation"
            type="password"
            placeholder="Repeat password"
            {...register('password_confirmation')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password_confirmation && (
            <p className="text-xs text-red-400">{errors.password_confirmation.message}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Registration failed. Please try again.
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-[0.15em] uppercase text-sm h-11 transition-all hover:scale-[1.02]"
        >
          {mutation.isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
