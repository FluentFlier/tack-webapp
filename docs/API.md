# API Reference

All API routes require authentication via InsForge cookie-based sessions.

## POST /api/chat

Send a message and receive an AI response.

**Request:**
```json
{
  "message": "Hello, can you help me?",
  "conversation_id": "optional-uuid"
}
```

**Response (200):**
```json
{
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "assistant",
    "content": "Of course! I'm Tack, ...",
    "metadata": {},
    "created_at": "2026-02-13T10:00:00Z"
  },
  "conversation_id": "uuid"
}
```

- If `conversation_id` is omitted, a new conversation is created automatically
- The conversation title is set to the first 100 characters of the first message

## GET /api/conversations/[id]/messages

Retrieve all messages for a conversation.

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Hello",
      "metadata": {},
      "created_at": "2026-02-13T10:00:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Hi there!",
      "metadata": {},
      "created_at": "2026-02-13T10:00:01Z"
    }
  ]
}
```

- Returns 404 if conversation doesn't exist or doesn't belong to the user

## POST/GET/DELETE /api/auth

InsForge authentication handlers. These are managed by `@insforge/nextjs` and handle:

- **POST** — Sign in / token exchange
- **GET** — Session validation
- **DELETE** — Sign out

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of the error"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing/invalid fields) |
| 401 | Not authenticated |
| 404 | Resource not found |
| 500 | Internal server error |
