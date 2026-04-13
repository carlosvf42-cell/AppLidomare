import { SignIn } from "@clerk/nextjs";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#080808" }}
    >
      {/* Logo */}
      <div className="mb-8">
        <Logo className="w-[200px]" />
      </div>

      {/* Clerk SignIn component */}
      <SignIn
        routing="hash"
        forceRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: "#2abfbf",
            colorBackground: "#141414",
            colorInputBackground: "#1a1a1a",
            colorInputText: "#f0f0f0",
            colorText: "#f0f0f0",
            colorTextSecondary: "#888888",
            colorNeutral: "#888888",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontWeight: { normal: 300, medium: 400, bold: 500 },
          },
          elements: {
            card: {
              background: "#141414",
              border: "1px solid #222",
              boxShadow: "none",
            },
            headerTitle: { color: "#f0f0f0", fontWeight: 300 },
            headerSubtitle: { color: "#888" },
            socialButtonsBlockButton: {
              background: "#1a1a1a",
              border: "1px solid #222",
              color: "#f0f0f0",
            },
            dividerLine: { background: "#222" },
            dividerText: { color: "#555" },
            formFieldLabel: { color: "#888", fontSize: "0.75rem" },
            formFieldInput: {
              background: "#1a1a1a",
              border: "1px solid #222",
              color: "#f0f0f0",
            },
            formButtonPrimary: {
              background: "#2abfbf",
              color: "#080808",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            },
            footerActionLink: { color: "#2abfbf" },
            identityPreviewText: { color: "#f0f0f0" },
            identityPreviewEditButton: { color: "#2abfbf" },
          },
        }}
      />

      {/* Footer */}
      <p className="text-[#2a2a2a] text-[10px] text-center mt-8 tracking-wider">
        Powered by Antifrágil®
      </p>
    </div>
  );
}
