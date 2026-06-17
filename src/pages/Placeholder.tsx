interface Props { title: string }
export default function Placeholder({ title }: Props) {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground">This module is coming soon.</p>
    </div>
  )
}
