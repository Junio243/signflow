import { twMerge } from 'tailwind-merge';

export const cn = (...classes: Array<string | undefined | null | false>) =>
  twMerge(classes.filter(Boolean).join(' '));

export function Card(p: any) {
  return <div className={cn('card', p.className)}>{p.children}</div>;
}
export function Label(p: any) {
  return <label className={cn('label', p.className)}>{p.children}</label>;
}
export function Input(p: any) {
  const { className, ...rest } = p;
  return <input {...rest} className={cn('input', className)} />;
}
