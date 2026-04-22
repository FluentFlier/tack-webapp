import { InsforgeMiddleware } from "@insforge/nextjs/middleware";

export default InsforgeMiddleware({
  baseUrl:
    process.env.NEXT_PUBLIC_INSFORGE_BASE_URL ||
    "https://5bycmn95.us-west.insforge.app",
  publicRoutes: ["/", "/about", "/auth/login", "/auth/sign-up", "/auth/forgot-password"],
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
