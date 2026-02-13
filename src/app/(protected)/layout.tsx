import { Header } from "@/components/layout";
import { Sidebar } from "@/components/layout";
import { FocusManager } from "@/components/a11y";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <FocusManager />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
