import * as React from "react"
import { cn } from "../../lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", fallback = "AD", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#3D3028]/40 bg-gradient-to-tr from-[#D4A373] to-[#F4E3D3] text-[#1C1512] font-bold items-center justify-center text-xs select-none shadow-sm",
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="leading-none tracking-tight">{fallback}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
