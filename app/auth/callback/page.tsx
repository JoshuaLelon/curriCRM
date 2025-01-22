export default function AuthCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-lg font-semibold">Signing you in...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  )
} 