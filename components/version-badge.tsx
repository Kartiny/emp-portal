import { Badge } from "@/components/ui/badge"

interface VersionBadgeProps {
  version: string
}

export function VersionBadge({ version }: VersionBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs">
      v{version}
    </Badge>
  )
}

