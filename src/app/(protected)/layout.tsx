import { Header } from "@/components/layout";
import { Sidebar } from "@/components/layout";
import { FocusManager } from "@/components/a11y";
import { SignedIn, SignedOut } from "@insforge/nextjs";
import SignInFirst from "@/components/sign-in-first";

//token and userID check added using Github Copilot to redirect to home page if a user isn't signed in

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  

  return (
    <>
      <SignedIn>
        <div className="app-shell flex flex-col h-screen">
          <Header />
          <FocusManager />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="app-main flex-1 overflow-y-auto" role="main">
              {children}
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <SignInFirst />
      </SignedOut>
    </>
  );
}
