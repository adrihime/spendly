import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { Card, CardContent } from '@/components/ui/card'

export function LoginScreen({ onSuccess }: { onSuccess: (credential: string) => void }) {
  function handleSuccess(response: CredentialResponse) {
    if (response.credential) onSuccess(response.credential)
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <span className="text-2xl font-semibold">Spendly</span>
          <p className="text-sm text-zinc-400">Entre com sua conta Google pra continuar</p>
          <GoogleLogin onSuccess={handleSuccess} theme="filled_black" shape="pill" />
        </CardContent>
      </Card>
    </div>
  )
}
