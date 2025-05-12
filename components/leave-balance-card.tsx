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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{type}</CardTitle>
        <CardDescription>Available balance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{remaining}</p>
              <p className="text-sm text-muted-foreground">days remaining</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {used} / {total}
              </p>
              <p className="text-sm text-muted-foreground">days used</p>
            </div>
          </div>
          <Progress value={percentage} className={`h-2 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

