import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LeaveBalanceCardProps {
  type: string
  used: number
  total: number
  color: string
}

export function LeaveBalanceCard({ type, used, total, color }: LeaveBalanceCardProps) {
  const remaining = total - used
  const percentage = (used / total) * 100

  return (
    <Card className="py-2 px-3">
      <CardHeader className="pb-1 pt-2 px-2">
        <CardTitle className="text-base font-semibold mb-0">{type}</CardTitle>
        <CardDescription className="text-xs">Available balance</CardDescription>
      </CardHeader>
      <CardContent className="py-2 px-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold leading-tight">{remaining}</p>
              <p className="text-xs text-muted-foreground">days remaining</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium">
                {used} / {total}
              </p>
              <p className="text-xs text-muted-foreground">days used</p>
            </div>
          </div>
          <Progress value={percentage} className={`h-2 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

