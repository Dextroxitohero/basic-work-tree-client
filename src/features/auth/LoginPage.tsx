import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { Navigate } from 'react-router'
import { z } from 'zod'
import { login, signup, type AuthSession } from '@/api/auth'
import { ApiRequestError } from '@/api/errors'
import { PasswordInput } from '@/components/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notify } from '@/lib/notify'
import { OrgMark, OrgTreeArt } from './OrgArt'
import { useAuthStore } from './store'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu email').email('El email no es válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
})

const signupSchema = z.object({
  full_name: z.string().trim().min(1, 'Escribe tu nombre').max(120, 'Máximo 120 caracteres'),
  email: z.string().trim().min(1, 'Escribe tu email').email('El email no es válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128, 'Máximo 128 caracteres'),
})

type Mode = 'login' | 'signup'
type Values = { full_name: string; email: string; password: string }

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const [mode, setMode] = useState<Mode>('login')
  const [formError, setFormError] = useState<string | null>(null)
  // 429: segundos que faltan para poder reintentar (cabecera Retry-After).
  const [retry, setRetry] = useState(0)
  const blocked = retry > 0
  useEffect(() => {
    if (!blocked) return
    const id = setInterval(() => setRetry((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [blocked])

  const form = useForm<Values>({
    resolver: zodResolver(mode === 'login' ? loginSchema : signupSchema) as never,
    defaultValues: { full_name: '', email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const mutation = useMutation<AuthSession, ApiRequestError, Values>({
    mutationFn: (v) =>
      mode === 'login'
        ? login({ email: v.email, password: v.password })
        : signup({ full_name: v.full_name, email: v.email, password: v.password }),
    onSuccess: (session) => {
      setSession(session)
      notify.success(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada', session.user.email)
    },
    onError: (error) => {
      // Los 401/409/422/429 se muestran en el formulario; el resto lo cubre el toast global.
      if (error.status === 429) {
        setRetry(error.retryAfter ?? 60)
        setFormError(error.message)
      } else if (error.code === 'invalid_credentials') setFormError('Email o contraseña incorrectos')
      else if (error.code === 'user_email_exists')
        form.setError('email', { message: 'Ya existe una cuenta con este email' })
      else if (error.status === 422)
        error.validation.forEach((d) => {
          const field = d.loc[d.loc.length - 1]
          if (typeof field === 'string')
            form.setError(field as FieldPath<Values>, { message: d.msg })
        })
      else if (error.code === 'account_disabled') setFormError('Tu cuenta está desactivada')
    },
  })

  if (token) return <Navigate to="/" replace />

  function switchMode(next: Mode) {
    setMode(next)
    setFormError(null)
    form.clearErrors()
  }

  const isLogin = mode === 'login'

  return (
    <main className="grid min-h-svh place-items-center p-3 sm:p-6 lg:p-10">
      <div className="bg-background grid w-full max-w-5xl overflow-clip rounded-[1.75rem] shadow-[0_30px_80px_-20px_rgb(8_4_40/0.6)] lg:min-h-[40rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <OrgMark className="size-7" />
          <span className="text-[15px] font-semibold tracking-tight">Work Tree</span>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isLogin ? 'Te damos la bienvenida' : 'Crea tu cuenta'}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {isLogin
              ? 'Inicia sesión para gestionar a tu equipo.'
              : 'Tu cuenta empieza con acceso de solo lectura.'}
          </p>

          <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)} className="mt-7">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarme</TabsTrigger>
            </TabsList>
          </Tabs>

          <form
            noValidate
            onSubmit={form.handleSubmit((values) => {
              setFormError(null)
              mutation.mutate(values)
            })}
            className="mt-6 grid gap-4"
          >
            {!isLogin && (
              <Field id="full_name" label="Nombre completo" error={errors.full_name?.message}>
                <Input
                  id="full_name"
                  autoComplete="name"
                  aria-invalid={!!errors.full_name}
                  aria-describedby={errors.full_name ? 'full_name-error' : undefined}
                  {...form.register('full_name')}
                />
              </Field>
            )}
            <Field id="email" label="Email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...form.register('email')}
              />
            </Field>
            <Field id="password" label="Contraseña" error={errors.password?.message}>
              <PasswordInput
                // Al cambiar entre acceso y registro la contraseña vuelve a empezar oculta.
                key={mode}
                id="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...form.register('password')}
              />
            </Field>

            {formError && (
              <p role="alert" className="bg-destructive/8 text-destructive rounded-md px-3 py-2 text-sm">
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting || mutation.isPending || blocked} className="mt-1">
              {mutation.isPending ? 'Un momento…' : blocked ? `Reintenta en ${formatWait(retry)}` : isLogin ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>
        </div>
      </section>

      <aside className="bg-primary text-primary-foreground m-3 hidden flex-col justify-between gap-10 rounded-[1.25rem] p-10 lg:flex">
        <div className="grid flex-1 place-items-center">
          <OrgTreeArt aria-hidden className="h-auto w-full max-w-md" />
        </div>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-tight">
            Tu equipo, sus puestos y sus jefes en un solo lugar.
          </p>
          <p className="text-primary-foreground/80 mt-3 text-sm">
            Altas, bajas y cambios de puesto, con el historial siempre a mano.
          </p>
        </div>
      </aside>
      </div>
    </main>
  )
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m} min` : `${m} min ${s} s`
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
}
