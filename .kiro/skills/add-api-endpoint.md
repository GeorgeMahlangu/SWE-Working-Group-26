---
name: add-api-endpoint
description: Step-by-step guide for adding a new API endpoint to the disputes router
inclusion: manual
---

# Skill: Add an API Endpoint

Use this skill when adding a new route to `server/src/routes/disputes.ts`.

## Checklist

### 1. Add the route in `server/src/routes/disputes.ts`
- Keep handler thin — validate input, call service, return response
- Use `req.params`, `req.query`, `req.body` — never trust raw values
- All routes are prefixed `/api/disputes` via the router aggregator
- Return consistent shapes: `{ data: ... }` for success, `{ error: string }` for failures
- Use correct HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error

### 2. Add business logic in `server/src/services/disputeService.ts`
- No Express types in service functions — accept plain objects, return plain objects
- Prisma queries live here — not in route handlers

### 3. Validate input
- Server-side validation is mandatory (REQ-009)
- Reject any `paymentType`, `issueCategory`, or `transactionStatus` outside the defined enumerations
- Return `{ error: 'Field name is required', field: 'fieldName' }` for missing required fields

### 4. Update `docs/api-spec.md`
- Add the new endpoint: method, path, request body, response shape, error codes

### 5. Update `structure.md` API Endpoints table if it's a new route

### 6. Add an integration test in `server/tests/disputes.test.ts`
- Happy path test
- Validation failure tests (missing fields, invalid enums)
- Edge case tests

## Handler Template

```ts
router.post('/', async (req: Request, res: Response) => {
  const { customerName, accountNumber, /* ... */ } = req.body

  // Validate required fields
  if (!customerName) {
    return res.status(400).json({ error: 'Customer name is required', field: 'customerName' })
  }

  try {
    const result = await disputeService.createDispute(req.body)
    return res.status(201).json({ data: result })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})
```
