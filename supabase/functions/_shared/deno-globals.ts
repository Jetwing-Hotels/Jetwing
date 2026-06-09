// Ambient declaration for the Deno global used by Supabase Edge Functions.
//
// These functions run on Deno (not Node), so `Deno` is provided at runtime by the
// Edge runtime. This repo's Next.js tsconfig excludes `supabase/functions` from the
// build, but editors may still type-check an open file with the Node TS server,
// which doesn't know `Deno`. Side-effect importing this module gives those editors a
// typed `Deno` so it isn't flagged — without `any` and without a triple-slash ref.
//
// At runtime this compiles to an empty module (declarations emit no JS).

export {};

declare global {
  // Minimal surface actually used by these functions (serve + env.get).
  const Deno: {
    serve(handler: (req: Request) => Response | Promise<Response>): void;
    env: { get(key: string): string | undefined };
  };
}
