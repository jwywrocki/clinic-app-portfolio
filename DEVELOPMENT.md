# Development Guidelines

## Getting Started

```bash
npm install
npm run dev      # starts on http://localhost:4000
```

Copy `.env.example` to `.env.local` and fill in values before first run.

## Scripts

```bash
npm run dev            # Development server (port 4000)
npm run build          # Production build
npm run start          # Production server (uses PORT or 4000 fallback)
npm run lint           # ESLint check
npm run lint:fix       # ESLint with auto-fix
npm run type-check     # TypeScript check (no emit)
npm run format         # Prettier format all files
npm run format:check   # Prettier check (CI)
npm run test           # Jest unit tests
npm run test:watch     # Jest in watch mode
npm run test:coverage  # Jest with coverage report
```

## Code Style and Standards

### TypeScript
- Always use TypeScript for new files
- Strict mode is enabled (`tsconfig.json`)
- Use explicit return types for functions
- Prefer `const` over `let` when variables don't change
- Avoid `any` — use `unknown` when type is truly unknown
- Prefer interfaces over types for object shapes

```typescript
// Good
const calculateTotalPrice = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price, 0);
};
```

### React Components

#### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { SomeType } from '@/types';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component
export function Component({ title, onAction }: ComponentProps) {
  // 4. State and hooks
  const [loading, setLoading] = useState(false);

  // 5. Event handlers
  const handleClick = () => {
    // implementation
  };

  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

#### Component Guidelines
- Use functional components with hooks
- Extract complex logic into custom hooks (`hooks/`)
- Keep components small and focused
- Use meaningful prop names

## Error Handling

### API Layer
```typescript
// Always use the handleApiRequest wrapper
export async function GET(request: Request) {
  return handleApiRequest(async () => {
    const result = await service.getData();
    if (result.isFailure()) throw result.error;
    return result.data;
  });
}
```

### Service Layer
```typescript
// Always return Result types
async createDoctor(request: CreateDoctorRequest): Promise<Result<Doctor>> {
  const validationResult = this.validateRequest(request);
  if (validationResult.isFailure()) return validationResult;

  try {
    return await this.repository.create(request);
  } catch (error) {
    return failure(new DomainError('Failed to create doctor', 'CREATE_ERROR', error));
  }
}
```

### Component Layer
```typescript
const { doctors, loading, error } = useDoctors();

if (error) {
  return <ErrorMessage message={error} onRetry={refetch} />;
}
```

## Database Operations

### Database Provider
The app auto-detects the database backend based on env vars. Override with `DB_CONNECTION`:

```bash
DB_CONNECTION=supabase   # or postgres / mysql
```

Always access the database through the repository layer — never call `getDB()` directly from API routes or components.

### Repository Pattern
```typescript
class DoctorRepositoryImpl extends BaseRepository<Doctor> {
  async findBySpecialization(specialization: string): Promise<Result<Doctor[]>> {
    try {
      return await this.findByField('specialization', specialization);
    } catch (error) {
      return failure(new DomainError('Database error', 'DB_ERROR', error));
    }
  }
}
```

## Validation

Use Zod schemas defined in `lib/schemas/`. Validate at API boundaries (route handlers), not inside the domain layer.

```typescript
// In a route handler
const parsed = MySchema.safeParse(await request.json());
if (!parsed.success) {
  return createErrorResponse(new ValidationError(parsed.error.message, 'body'));
}
```

For service-level validation:
```typescript
private validateCreateDoctorRequest(request: CreateDoctorRequest): Result<void> {
  const errors: string[] = [];

  if (!request.first_name || request.first_name.length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (errors.length > 0) {
    return failure(new ValidationError(errors.join(', '), 'validation'));
  }

  return success(undefined);
}
```

## File Organization

### Directory Structure
```
app/
├── api/
│   └── [resource]/
│       ├── route.ts          # Collection operations (GET, POST)
│       └── [id]/
│           └── route.ts      # Individual resource operations (GET, PUT, DELETE)
├── admin/
│   ├── (dashboard)/[feature]/page.tsx   # Admin pages
│   ├── actions/[feature].ts             # Server Actions
│   └── components/[Feature]Management.tsx
components/
├── home/                     # Home page sections
├── ui/                       # Reusable component library (Radix UI based)
└── layout/                   # Header, footer, layout wrapper
hooks/
└── use-[feature].ts          # Custom hooks
lib/
├── domain/                   # Entities, errors, Result pattern
├── db/providers/             # supabase / postgres / mysql
├── repositories/             # Data access implementations
├── services/                 # Business logic
├── schemas/                  # Zod validation schemas
└── utils/                    # Shared utilities
```

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Directories | kebab-case | `contact-groups/` |
| Component files | kebab-case | `doctor-card.tsx` |
| Utility files | camelCase | `apiHelpers.ts` |
| Components | PascalCase | `DoctorCard` |
| Variables / functions | camelCase | `handleSubmit` |
| Types / interfaces | PascalCase | `CreateDoctorRequest` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

## Admin Panel

Admin pages live under `app/admin/(dashboard)/`. Each feature has:

1. A page at `app/admin/(dashboard)/[feature]/page.tsx`
2. A management component at `app/admin/components/[Feature]Management.tsx`
3. Server Actions at `app/admin/actions/[feature].ts` for mutations

The admin panel is protected by NextAuth middleware. Only users with `is_active: true` in the `users` table can log in.

## Authentication

- NextAuth v5 with Credentials provider
- JWT session, 8-hour TTL
- Passwords are hashed with bcrypt + pepper (`BCRYPT_SECRET_KEY`)
- Rate limiting on login: 10 attempts / 15 min per IP (enforced in `middleware.ts`)

## HTML Content

When saving or displaying rich-text (HTML) content, always run it through the sanitizer:

```typescript
import { sanitizeHtml } from '@/lib/html-sanitizer';

const safe = sanitizeHtml(userProvidedHtml);
```

This uses `isomorphic-dompurify` with a configured allowlist of safe tags.

## Testing Guidelines

### Unit Tests
```typescript
describe('DoctorService', () => {
  let service: DoctorService;
  let mockRepository: jest.Mocked<DoctorRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new DoctorService(mockRepository);
  });

  it('should create doctor with valid data', async () => {
    const request = createValidDoctorRequest();
    mockRepository.create.mockResolvedValue(success(createMockDoctor()));

    const result = await service.createDoctor(request);

    expect(result.isSuccess()).toBe(true);
  });
});
```

### Component Tests
```typescript
it('renders doctor information correctly', () => {
  render(<DoctorCard doctor={mockDoctor} />);
  expect(screen.getByText(mockDoctor.first_name)).toBeInTheDocument();
});
```

## Performance Best Practices

### React
- Use `React.memo` only where profiling shows a benefit
- Provide correct dependency arrays in `useEffect` / `useMemo` / `useCallback`
- Use proper loading states — components in `ui/` include skeleton variants

### Database
- Use pagination (`PaginationOptions`) for list endpoints
- Cache frequently read, rarely changed data (e.g., menu items — see `lib/menu-cache.ts`)
- Use efficient parameterized queries through the repository layer

### API
- Return only the fields the client needs
- Use HTTP caching headers where appropriate
- Keep response payloads small

## Security Best Practices

- **Input validation**: Always validate on the server in API route handlers
- **HTML content**: Always sanitize with `lib/html-sanitizer.ts`
- **Parameterized queries**: Never construct SQL strings from user input
- **Secrets**: Use environment variables — never hard-code credentials
- **Error messages**: Do not expose internal error details to clients
- **GDPR**: Follow personal data handling guidelines for patient information

## Code Review Checklist

### Before Submitting PR
- [ ] Code follows style guidelines above
- [ ] No `console.log` / `console.error` left in production paths (use proper error propagation)
- [ ] Error handling is implemented (Result pattern in services, `handleApiRequest` in routes)
- [ ] TypeScript types are properly defined (no `any`)
- [ ] Inputs are validated with Zod schemas
- [ ] HTML content passes through the sanitizer (`lib/html-sanitizer.ts`)
- [ ] Performance considerations addressed (pagination, caching)
- [ ] New API endpoints use `requireAuth` or `requireRole` for auth
- [ ] Database access goes through repositories (not direct `getDB()` in routes/actions)
- [ ] Server Actions call `revalidatePath()` after mutations

### Reviewer Checklist
- [ ] Business logic is in the service layer (not in route handlers or components)
- [ ] Database access goes through repositories
- [ ] Error handling is comprehensive and propagates correctly
- [ ] Security considerations addressed
- [ ] Naming conventions followed
