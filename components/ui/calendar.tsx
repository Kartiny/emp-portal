"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  initialMonth?: Date;
};

const VIEW_MODES = [
  { value: "months", label: "Year" },
  { value: "month", label: "Month" },
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  initialMonth,
  ...props
}: CalendarProps) {
  const today = new Date();
  const [viewMode, setViewMode] = React.useState<"months" | "month">("months");
  const [month, setMonth] = React.useState(
    initialMonth ? initialMonth.getMonth() : today.getMonth()
  );
  const [year, setYear] = React.useState(
    initialMonth ? initialMonth.getFullYear() : today.getFullYear()
  );

  React.useEffect(() => {
    if (initialMonth) {
      setMonth(initialMonth.getMonth());
      setYear(initialMonth.getFullYear());
    }
  }, [initialMonth]);

  const selectedMonth = new Date(year, month, 1);
  const monthsGrid = Array.from({ length: 12 }, (_, idx) => new Date(year, idx, 1));

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-2 mb-6 w-full overflow-x-auto">
      <select
          className="border rounded px-2 py-1 text-sm bg-background"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as "months" | "month")}
        >
          {VIEW_MODES.map((vm) => (
            <option key={vm.value} value={vm.value}>
              {vm.label}
            </option>
          ))}
        </select>

        {viewMode === "months" && (
          <>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 p-0 flex items-center justify-center"
              )}
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous Year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="ml-2 text-sm font-medium">{year}</span>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 p-0 flex items-center justify-center"
              )}
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next Year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Today Button */}
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "default" }),
            "ml-2 px-3 py-1 rounded bg-blue-900 text-white hover:bg-blue-800 transition-colors"
          )}
          onClick={() => {
            const now = new Date();
            if (viewMode === "months") {
              setYear(now.getFullYear());
            } else {
              setMonth(now.getMonth());
              setYear(now.getFullYear());
            }
          }}
        >
          {viewMode === "months"
            ? `Today: ${new Date().getFullYear()}`
            : `Today: ${MONTHS[new Date().getMonth()]}/${new Date().getFullYear()}`}
        </button>
      </div>

      {/* Year View */}
      {viewMode === "months" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          {monthsGrid.map((date, idx) => (
            <div key={idx} className="border rounded-lg p-2 bg-background w-full">
              <div className="text-center font-semibold mb-2 text-primary">
                {MONTHS[date.getMonth()]}
              </div>
              <DayPicker
                showOutsideDays={showOutsideDays}
                month={date}
                onMonthChange={() => {}}
                className={cn("p-1 w-full", className)}
                classNames={{
                  ...classNames,
                  months: "",
                  month: "w-full",
                  caption: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between",
                  head_cell:
                    "text-muted-foreground rounded-md flex-1 text-xs sm:text-sm text-center",
                  row: "flex w-full mt-1 justify-between",
                  cell: "relative p-0 flex-1 aspect-square max-w-[40px]",
                  day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full h-full flex items-center justify-center text-xs sm:text-sm font-normal aria-selected:opacity-100"
                  ),
                  day_range_end: "day-range-end",
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-blue-900 text-white",
                  day_outside:
                    "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: () => null,
                  IconRight: () => null,
                }}
                {...props}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Month View */
        <div className="w-full max-w-md mx-auto px-2">
          <DayPicker
            showOutsideDays={showOutsideDays}
            month={selectedMonth}
            onMonthChange={(date) => {
              setMonth(date.getMonth());
              setYear(date.getFullYear());
            }}
            className={cn("p-1 w-full", className)}
            classNames={{
              months: "",
              month: "w-full",
              caption: "flex justify-center pt-2 mb-4 relative items-center",
              caption_label: "text-xs sm:text-sm md:text-base",
              nav: "space-x-2 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full justify-between",
              head_cell:
                "text-muted-foreground rounded-md w-8 text-xs sm:text-sm text-center",
              row: "flex w-full mt-1 justify-between",
              cell: "text-center relative p-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-xs sm:text-sm",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-full w-full flex items-center justify-center aria-selected:opacity-100 text-xs sm:text-sm"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-blue-900 text-white",
              day_outside:
                "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              ...classNames,
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
            }}
            {...props}
          />
        </div>
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
