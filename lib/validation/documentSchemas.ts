import { z } from 'zod';

const trimmedNonEmptyString = z.preprocess(
  value => (typeof value === 'string' ? value.trim() : value),
  z.string().min(1)
);

const optionalTrimmedString = z.preprocess(
  value => (typeof value === 'string' ? value.trim() : value),
  z.union([z.string().min(1), z.literal(null)]).optional()
);

const finiteNumber = z.number().finite();

const coerceFiniteNumber = z.preprocess(
  value => {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        const parsed = Number(trimmed);

        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return value;
  },
  finiteNumber
);

export const documentIdSchema = z.string().uuid();

export const positionSchema = z
  .object({
    page: finiteNumber.int().positive().optional().default(1),
    x: finiteNumber.optional(),
    y: finiteNumber.optional(),
    nx: finiteNumber.optional(),
    ny: finiteNumber.optional(),
    scale: finiteNumber.optional(),
    rotation: finiteNumber.optional(),
  })
  .passthrough();

const storedPositionSchema = positionSchema.extend({
  page: coerceFiniteNumber.int().positive().optional().default(1),
  x: coerceFiniteNumber.optional(),
  y: coerceFiniteNumber.optional(),
  nx: coerceFiniteNumber.optional(),
  ny: coerceFiniteNumber.optional(),
  scale: coerceFiniteNumber.optional(),
  rotation: coerceFiniteNumber.optional(),
});

export const signatureMetaSchema = z
  .object({
    width: finiteNumber.optional(),
    height: finiteNumber.optional(),
  })
  .passthrough();

const signerBaseSchema = z
  .object({
    name: trimmedNonEmptyString,
    reg: optionalTrimmedString,
    certificate_type: optionalTrimmedString,
    certificate_valid_until: optionalTrimmedString,
    certificate_issuer: optionalTrimmedString,
    logo_url: optionalTrimmedString,
    email: optionalTrimmedString,
  })
  .passthrough();

export const signerSchema = signerBaseSchema.transform(signer => ({
  ...signer,
  reg: signer.reg ?? null,
  certificate_type: signer.certificate_type ?? null,
  certificate_valid_until: signer.certificate_valid_until ?? null,
  certificate_issuer: signer.certificate_issuer ?? null,
  logo_url: signer.logo_url ?? null,
  email: signer.email ?? null,
}));

export const metadataSchema = z
  .object({
    positions: z.array(positionSchema).default([]),
    signature_meta: signatureMetaSchema.nullable().optional(),
    validation_theme_snapshot: z.record(z.any()).nullable().optional(),
    validation_profile_id: optionalTrimmedString,
    signers: z.array(signerSchema).optional(),
  })
  .passthrough();

export const storedMetadataSchema = z.preprocess(
  value => {
    if (Array.isArray(value)) {
      return value.map(pos => (typeof pos === 'object' && pos ? pos : pos));
    }

    if (value && typeof value === 'object' && 'positions' in (value as any)) {
      const withPositions: any = value;
      return {
        ...withPositions,
        positions: Array.isArray(withPositions.positions)
          ? withPositions.positions.map((pos: unknown) => (typeof pos === 'object' && pos ? pos : pos))
          : withPositions.positions,
      };
    }

    return value;
  },
  z.union([
    metadataSchema.extend({ positions: z.array(storedPositionSchema).default([]) }),
    z.array(storedPositionSchema),
    z.null(),
    z.undefined(),
  ])
);

export type Position = z.infer<typeof positionSchema>;
export type Signer = z.infer<typeof signerSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
