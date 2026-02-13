interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: React.ElementType;
}

export function ScreenReaderOnly({
  children,
  as: Tag = "span",
}: ScreenReaderOnlyProps) {
  return <Tag className="sr-only">{children}</Tag>;
}
