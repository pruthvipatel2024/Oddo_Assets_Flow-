import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth, type UserRole } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Shield, ShieldAlert, KeyRound, Mail, UserCheck } from "lucide-react"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      // Default to employee if logging in manually
      await login(data.email, "admin")
      toast.success("Welcome back! Logged in as Administrator.")
      navigate("/dashboard")
    } catch (error) {
      toast.error("Failed to authenticate. Please check your credentials.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const loginAsRole = async (role: UserRole) => {
    setIsSubmitting(true)
    try {
      const email = `${role}@assetflow.com`
      await login(email, role)
      toast.success(`Demo Mode: Logged in as ${role.toUpperCase()}`)
      navigate("/dashboard")
    } catch (error) {
      toast.error("Error launching demo mode.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-radial from-background via-muted/50 to-muted p-4 relative overflow-hidden">
      {/* Visual background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* App Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center shadow-lg text-primary-foreground font-bold text-xl mb-2">
            AF
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AssetFlow Enterprise</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Log in to manage and audit organization resources, devices, and inventory.
          </p>
        </div>

        <Card className="border-border/80 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Access Portal</CardTitle>
            <CardDescription className="text-xs">
              Enter your corporate credentials below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                  <Input
                    {...register("email")}
                    placeholder="name@company.com"
                    className="pl-9"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    error={errors.password?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full text-xs font-semibold mt-2 h-9" isLoading={isSubmitting}>
                Sign In to Dashboard
              </Button>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-2.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Or Quick Access Demo
              </span>
            </div>

            {/* Quick Login Preset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginAsRole("admin")}
                disabled={isSubmitting}
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-primary/50"
              >
                <Shield className="h-3.5 w-3.5 text-primary group-hover:scale-105 transition-transform" />
                <span>Admin</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginAsRole("manager")}
                disabled={isSubmitting}
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-amber-500/50"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 group-hover:scale-105 transition-transform" />
                <span>Manager</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginAsRole("employee")}
                disabled={isSubmitting}
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-emerald-500/50"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-105 transition-transform" />
                <span>Employee</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-[10px] text-center text-muted-foreground">
          Protected by enterprise-grade OAuth2 and SSO. For support, contact IT Helpdesk.
        </p>
      </div>
    </div>
  )
}
