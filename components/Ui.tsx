import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const cn = (...classes: Array<string | undefined | null | false>) =>
  twMerge(classes.filter(Boolean).join(' '));

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('card', className)} />
  ),
);

Card.displayName = 'Card';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label ref={ref} {...props} className={cn('label', className)} />
  ),
);

Label.displayName = 'Label';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={cn('input', className)} />
  ),
);

Input.displayName = 'Input';
