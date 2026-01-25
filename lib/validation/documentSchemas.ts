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

export const qrPositionSchema = z.enum(['bottom-left', 'bottom-right', 'top-left', 'top-right']).default('bottom-left');
export const qrPageSchema = z.enum(['last', 'first', 'all']).default('last');

export const metadataSchema = z
  .object({
    positions: z.array(positionSchema).default([]),
    signature_meta: signatureMetaSchema.nullable().optional(),
    validation_theme_snapshot: z.record(z.any()).nullable().optional(),
    validation_profile_id: optionalTrimmedString,
    validation_requires_code: z.boolean().optional(),
    validation_access_code: optionalTrimmedString,
    signers: z.array(signerSchema).optional(),
    qr_position: qrPositionSchema.optional(),
    qr_page: qrPageSchema.optional(),
  })
  .passthrough();

export const storedMetadataSchema = z.union([
  metadataSchema,
  z.array(positionSchema),
  z.null(),
  z.undefined(),
]);

export type Position = z.infer<typeof positionSchema>;
export type Signer = z.infer<typeof signerSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type QrPosition = z.infer<typeof qrPositionSchema>;
export type QrPage = z.infer<typeof qrPageSchema>;
