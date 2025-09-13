import { cn } from 'tailwind-merge';
export function Card(p:any){ return <div className={cn('card', p.className)}>{p.children}</div>; }
export function Label(p:any){ return <label className={cn('label', p.className)}>{p.children}</label>; }
export function Input(p:any){ return <input {...p} className={cn('input', p.className)} /> }
