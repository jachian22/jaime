import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ScriptInput } from "@/app/_components/teleprompter/script-input";

export default function Home() {
  return (
    <>
      {/* Auth UI in top-right corner */}
      <div className="fixed right-4 top-4 z-50">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      <ScriptInput />
    </>
  );
}
