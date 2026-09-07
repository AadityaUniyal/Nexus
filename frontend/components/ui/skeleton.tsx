import * as React from "react"

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-nexus-surface-highest/50", className)}
      {...props}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-nexus-outline-variant/30 bg-nexus-surface-lowest p-6 space-y-4 shadow-tactile">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full mt-4" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-nexus-outline-variant/30 bg-nexus-surface p-4 flex flex-col justify-center space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export { Skeleton, CardSkeleton, TableSkeleton, StatSkeleton }
