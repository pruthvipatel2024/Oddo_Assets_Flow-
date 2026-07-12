import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Layout, Calendar, Wrench, Shield, Users, BarChart3, Settings2 } from "lucide-react"

interface ModulePlaceholderProps {
  title: string
  description: string
  moduleName: string
}

export function ModulePlaceholder({ title, description, moduleName }: ModulePlaceholderProps) {
  const getIcon = () => {
    switch (moduleName.toLowerCase()) {
      case "reports":
        return <BarChart3 className="h-8 w-8 text-primary" />
      case "assets":
        return <Layout className="h-8 w-8 text-primary" />
      case "maintenance":
        return <Wrench className="h-8 w-8 text-amber-500" />
      case "bookings":
        return <Calendar className="h-8 w-8 text-emerald-500" />
      case "organization":
        return <Users className="h-8 w-8 text-blue-500" />
      case "audits":
        return <Shield className="h-8 w-8 text-purple-500" />
      default:
        return <Settings2 className="h-8 w-8 text-muted-foreground" />
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-dashed border-border/80 flex flex-col items-center justify-center p-12 text-center bg-card/40">
          <div className="p-4 bg-muted/40 rounded-full mb-4">
            {getIcon()}
          </div>
          <h3 className="text-base font-semibold text-foreground/90 mb-1.5 uppercase tracking-wide">
            {title} Module Workspace
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            This module is connected to the central AssetFlow router. The core components, state query pipelines, and TypeScript schemas have been initialized. Full views will be activated in the next development cycle.
          </p>
          <div className="flex gap-3">
            <Button size="sm" className="text-xs">
              Configure {title}
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              View Documentation
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Module Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Routing & Navigation</span>
                <Badge variant="success" className="text-[10px]">Active</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Design System Integration</span>
                <Badge variant="success" className="text-[10px]">Integrated</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Dynamic Mock APIs</span>
                <Badge variant="pending" className="text-[10px]">Staged</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Compliance Verification</span>
                <Badge variant="info" className="text-[10px]">WCAG AA</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Use the command palette (<kbd className="px-1 py-0.5 rounded bg-muted border font-mono text-[9px]">Ctrl+K</kbd>) to instantly jump between active modules, toggle themes, or trigger system actions from anywhere in the application.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
