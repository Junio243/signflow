# SignFlow API Documentation

## Authentication

All API requests require authentication via Bearer token in the Authorization header.

```http
Authorization: Bearer <your-access-token>
```

## Rate Limiting

- **Upload endpoint**: 50 requests per minute
- **Sign endpoint**: 20 requests per minute
- **Other endpoints**: 100 requests per minute

When rate limited, you'll receive a `429 Too Many Requests` response with a `Retry-After` header.

## Endpoints

### Upload Document

Uploads a PDF document for signing.

```http
POST /api/upload
Content-Type: multipart/form-data
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | File | Yes | PDF document to be signed (max 10MB) |
| `signature` | File | No | Signature image (PNG/JPG, max 5MB) |
| `original_pdf_name` | string | No | Original filename |
| `positions` | JSON string | No | Array of signature positions |
| `signers` | JSON string | No | Array of signer information |
| `qr_position` | string | No | QR code position: `bottom-left`, `bottom-right`, `top-left`, `top-right` |
| `qr_page` | string | No | QR code page: `first`, `last`, `all` |
| `validation_requires_code` | boolean | No | Whether validation requires access code |
| `validation_access_code` | string | Conditional | Access code if required |

**Response:**

```json
{
  "ok": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid authentication
- `413 Payload Too Large`: File exceeds size limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Sign Document

Applies signatures and QR code to a document.

```http
POST /api/sign
Content-Type: multipart/form-data
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Document ID |

**Response:**

```json
{
  "ok": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "signed_pdf_url": "https://...",
  "qr_code_url": "https://...",
  "validate_url": "https://app.signflow.com/validate/550e8400-..."
}
```

**Errors:**

- `400 Bad Request`: Invalid document ID
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not authorized to sign this document
- `404 Not Found`: Document not found
- `409 Conflict`: Document already signed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Document

Retrieves document information.

```http
GET /api/documents/:id
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "original_pdf_name": "contract.pdf",
  "status": "signed",
  "signed_pdf_url": "https://...",
  "qr_code_url": "https://...",
  "created_at": "2026-01-29T12:00:00Z",
  "expires_at": "2026-02-05T12:00:00Z"
}
```

---

### Validate Document

Validates a signed document.

```http
GET /api/validate/:id?code=ACCESS_CODE
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Document ID (in URL) |
| `code` | string | Conditional | Access code if required |

**Response:**

```json
{
  "isValid": true,
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "original_pdf_name": "contract.pdf",
    "status": "signed"
  },
  "signingEvents": [
    {
      "signer_name": "João Silva",
      "signer_reg": "123.456.789-00",
      "signed_at": "2026-01-29T12:00:00Z",
      "certificate_type": "A1",
      "certificate_issuer": "Autoridade Certificadora"
    }
  ]
}
```

---

## Position Object

Signature position object format:

```typescript
{
  page: number,        // Page number (1-indexed)
  nx: number,          // Normalized X position (0-1)
  ny: number,          // Normalized Y position (0-1)
  scale: number,       // Scale factor (default: 1)
  rotation: number     // Rotation in degrees (-45 to 45)
}
```

## Signer Object

Signer information format:

```typescript
{
  name: string,
  reg?: string,                      // CPF/CNPJ
  email?: string,
  certificate_type?: string,         // A1, A3, etc.
  certificate_valid_until?: string,  // ISO 8601 date
  certificate_issuer?: string,
  logo_url?: string
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message in Portuguese",
  "details": {} // Optional additional details
}
```

## Best Practices

1. **Always validate user input** before sending to the API
2. **Store tokens securely** - never expose in client-side code
3. **Handle rate limits** - implement exponential backoff
4. **Use HTTPS** - all requests must use secure connections
5. **Validate file types** - only send PDF files
6. **Check file sizes** - respect the size limits
7. **Handle errors gracefully** - show user-friendly messages

## Code Examples

### JavaScript/TypeScript

```typescript
// Upload document
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('signature', signatureFile);
formData.append('positions', JSON.stringify(positions));

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

if (!response.ok) {
  const error = await response.json();
  console.error('Upload failed:', error.error);
} else {
  const result = await response.json();
  console.log('Document ID:', result.id);
}

// Sign document
const signFormData = new FormData();
signFormData.append('id', documentId);

const signResponse = await fetch('/api/sign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: signFormData
});

const signed = await signResponse.json();
console.log('Signed PDF:', signed.signed_pdf_url);
```

### cURL

```bash
# Upload document
curl -X POST https://app.signflow.com/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@document.pdf" \
  -F "positions=[{\"page\":1,\"nx\":0.5,\"ny\":0.5,\"scale\":1,\"rotation\":0}]"

# Sign document
curl -X POST https://app.signflow.com/api/sign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id=550e8400-e29b-41d4-a716-446655440000"
```

## Support

For API support, please contact: support@signflow.com
