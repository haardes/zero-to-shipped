# Todo Tracking Application

A collaborative task management system built with Next.js 14+, TypeScript, and Supabase.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Validation**: Zod
- **Testing**: Vitest + fast-check (property-based testing)

## Project Structure

```
web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/       # Protected routes
│       ├── dashboard/
│       └── lists/
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── lists/            # List management components
│   └── items/            # Item management components
├── lib/                  # Library code
│   └── supabase/         # Supabase client configuration
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── vitest.config.ts      # Vitest configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account with project created

### Environment Variables

Create a `.env.local` file in the web directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Features

- User authentication with secure session management
- Personal and shared todo lists
- Role-based collaboration (owner, editor, viewer)
- Real-time data synchronization via Supabase
- Type-safe data layer with generated TypeScript types
- Comprehensive test coverage with property-based testing
