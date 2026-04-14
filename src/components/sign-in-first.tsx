//Basic page to redirect to in the event the user isn't signed in yet but needs to, written on 4-14-2026 by Daniel Briggs, basic template copied from another file then modified
//Github Copilot inline suggests used to update imports

import { SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";


export default function Page() {
  
return <>
  
    <h1 className="text-3xl font-bold">You may have to sign in first to use this page. If you are already signed in please wait a few seconds and the page should finish loading. Otherwise, click the button below to go to the sign in page</h1>
    <SignInButton>
      <Button size="sm" className="mt-2 gap-2 text-muted-foreground text-foreground">
        Sign In     
      </Button>
    </SignInButton>
  </>;
}
