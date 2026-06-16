import React from 'react'

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
        A
      </div>
      {!collapsed && (
        <span className="text-base font-semibold tracking-tight">
          Agency<span className="opacity-50 font-normal">OS</span>
        </span>
      )}
    </div>
  )
}
