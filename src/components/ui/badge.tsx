import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]",
        active:
          "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]",
        inactive:
          "bg-gray-100 text-gray-500 border border-gray-200",
        secondary:
          "bg-gray-100 text-gray-800 border border-gray-200",
        destructive:
          "bg-red-50 text-red-600 border border-red-200",
        outline: "text-foreground border border-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
