// Avatar de usuario: muestra su emoji de perfil; si no tiene, la inicial.
export function Avatar({
  emoji,
  name,
  className = 'h-11 w-11 text-xl',
}: {
  emoji?: string | null
  name?: string | null
  className?: string
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 ${className}`}
    >
      {emoji ? emoji : (name ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}
