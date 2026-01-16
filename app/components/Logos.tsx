import Image from 'next/image'

type LogoProps = {
  className?: string
  priority?: boolean
}

const baseClass = (className?: string) => ['logo-img', className].filter(Boolean).join(' ')

export function BancoDoBrasilLogo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logos/banco-do-brasil.svg"
      alt="Banco do Brasil"
      width={150}
      height={50}
      className={baseClass(className)}
      priority={priority}
    />
  )
}

export function HospitalEinsteinLogo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logos/hospital-einstein.svg"
      alt="Hospital Israelita Albert Einstein"
      width={150}
      height={50}
      className={baseClass(className)}
      priority={priority}
    />
  )
}

export function MagazineLuizaLogo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logos/magazine-luiza.svg"
      alt="Magazine Luiza"
      width={150}
      height={50}
      className={baseClass(className)}
      priority={priority}
    />
  )
}

export function GovBrLogo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logos/govbr.svg"
      alt="Gov.br"
      width={150}
      height={50}
      className={baseClass(className)}
      priority={priority}
    />
  )
}
