export default function IconActionButton({
  icon: Icon,
  label,
  tone = 'neutral',
  className = '',
  type = 'button',
  ...buttonProps
}) {
  return (
    <button
      {...buttonProps}
      type={type}
      aria-label={label}
      title={label}
      className={`icon-action icon-action--${tone} ${className}`.trim()}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2} />
    </button>
  )
}