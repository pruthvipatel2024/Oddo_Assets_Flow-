import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Shield, ShieldAlert, KeyRound, Mail, UserCheck, ArrowRight, UserPlus, Info } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/Dialog"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

const signupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

export function LoginPage() {
  const { login, signup, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mode, setMode] = React.useState<"login" | "signup">("login")
  
  // Forgot Password state
  const [forgotOpen, setForgotOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState("")
  const [forgotLoading, setForgotLoading] = React.useState(false)

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  // Signup Form
  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const onLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
      toast.success("Welcome back! Logged in successfully.")
      navigate("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate. Please check your credentials.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSignup = async (data: SignupFormValues) => {
    setIsSubmitting(true)
    try {
      await signup(data.name, data.email)
      toast.success("Account created! You can now log in using your credentials.")
      setMode("login")
      resetLoginForm({ email: data.email, password: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error("Please enter an email address.")
      return
    }
    setForgotLoading(true)
    try {
      await forgotPassword(forgotEmail)
      toast.success(`A password reset link has been dispatched to ${forgotEmail}.`)
      setForgotOpen(false)
      setForgotEmail("")
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.")
    } finally {
      setForgotLoading(false)
    }
  }

  const loginAsRole = async (role: "admin" | "manager" | "employee") => {
    setIsSubmitting(true)
    try {
      const email = `${role}@assetflow.com`
      const password = `${role}123`
      await login(email, password)
      toast.success(`Demo Mode: Logged in as ${role.toUpperCase()}`)
      navigate("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Error launching demo mode.")
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {mode === "login" ? "Access Portal" : "Employee Registration"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {mode === "login" ? "Enter your corporate credentials below" : "Create a new Employee account"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-[10px] h-7 px-2 font-bold cursor-pointer"
              >
                {mode === "login" ? (
                  <span className="flex items-center gap-1">Register <ArrowRight className="h-3 w-3" /></span>
                ) : (
                  <span>Sign In Instead</span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                    <Input
                      {...loginRegister("email")}
                      placeholder="name@company.com"
                      className="pl-9 text-xs"
                      error={loginErrors.email?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                    <Input
                      {...loginRegister("password")}
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 text-xs"
                      error={loginErrors.password?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full text-xs font-semibold mt-2 h-9 cursor-pointer" isLoading={isSubmitting}>
                  Sign In to Dashboard
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                    <Input
                      {...signupRegister("name")}
                      placeholder="John Doe"
                      className="pl-9 text-xs"
                      error={signupErrors.name?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                    <Input
                      {...signupRegister("email")}
                      placeholder="name@company.com"
                      className="pl-9 text-xs"
                      error={signupErrors.email?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Choose Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
                    <Input
                      {...signupRegister("password")}
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-9 text-xs"
                      error={signupErrors.password?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full text-xs font-semibold mt-2 h-9 cursor-pointer" isLoading={isSubmitting}>
                  <UserPlus className="h-4 w-4 mr-2" /> Register New Account
                </Button>
              </form>
            )}

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
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-primary/50 cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-primary group-hover:scale-105 transition-transform" />
                <span>Admin</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginAsRole("manager")}
                disabled={isSubmitting}
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-amber-500/50 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 group-hover:scale-105 transition-transform" />
                <span>Manager</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginAsRole("employee")}
                disabled={isSubmitting}
                className="text-[10px] h-8 flex flex-col gap-0.5 justify-center py-1 group hover:border-emerald-500/50 cursor-pointer"
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)}>
        <DialogContent className="max-w-sm p-5 bg-card border-border/80" onClose={() => setForgotOpen(false)}>
          <div className="space-y-4">
            <div className="flex gap-2.5 items-start">
              <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">Reset Password</h3>
                <p className="text-xs text-muted-foreground">
                  Provide your registered corporate email to dispatch a verification recovery token.
                </p>
              </div>
            </div>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="text-xs h-9"
                disabled={forgotLoading}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotLoading}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={forgotLoading}
                  className="text-xs h-8"
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
