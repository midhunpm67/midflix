import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate(isAdmin() ? '/admin' : '/')
    },
  })

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-5xl tracking-[0.2em] text-white uppercase">
          MidFlix
        </h1>
        <p className="text-sm text-muted">Sign in to continue watching</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
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
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Invalid email or password
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-[0.15em] uppercase text-sm h-11 transition-all hover:scale-[1.02]"
        >
          {mutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <Link to="#" className="text-xs text-muted hover:text-white transition-colors">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
