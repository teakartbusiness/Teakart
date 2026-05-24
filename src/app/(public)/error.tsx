'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicError({ error: _error, reset }: Props) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or head back to the home page.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()}>Try again</Button>
          <Link
            href="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
