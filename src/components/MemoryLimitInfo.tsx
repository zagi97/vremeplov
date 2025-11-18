import { CheckCircle2, XCircle, Info } from "lucide-react"

interface UploadLimitInfo {
  canUpload: boolean
  uploadsToday: number
  remainingToday: number
  userTier: string
  dailyLimit: number
  nextTierInfo?: string
}

interface MemoryLimitInfoProps {
  uploadLimitInfo: UploadLimitInfo | null
}

export const MemoryLimitInfo = ({ uploadLimitInfo }: MemoryLimitInfoProps) => {
  if (!uploadLimitInfo) return null

  const isVerified = uploadLimitInfo.userTier === "VERIFIED"
  const hasReachedLimit = !uploadLimitInfo.canUpload

  // ✅ VERIFICIRAN - Jednostavno zeleno
  if (isVerified) {
    return (
      <div className="mt-4 p-5 bg-green-50 border-3 border-green-300 rounded-xl">
        <div className="flex items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-green-900">
              ✓ Verificirani ste
            </p>
            <p className="text-lg text-green-800 mt-1">
              Možete dodati neograničeno slika
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 🔴 LIMIT DOSTIGNUT - Jasno crveno
  if (hasReachedLimit) {
    return (
      <div className="mt-4 p-5 bg-red-50 border-3 border-red-300 rounded-xl">
        <div className="flex items-start gap-4">
          <XCircle className="h-10 w-10 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-xl font-bold text-red-900">
              ✋ Dostigli ste dnevni limit
            </p>
            <p className="text-lg text-red-800 mt-2">
              Možete dodati još{" "}
              <span className="text-3xl font-bold text-red-600">0</span>{" "}
              slika danas
            </p>
            
            {/* Veliki napomena */}
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              <p className="text-lg font-bold text-red-900">
                📅 Pokušajte sutra
              </p>
              <p className="text-base text-red-800 mt-1">
                Novi korisnici mogu dodati 1 sliku dnevno
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 🔵 IMA PREOSTALO - Jasno plavo
  return (
    <div className="mt-4 p-5 bg-blue-50 border-3 border-blue-300 rounded-xl">
      <div className="flex items-start gap-4">
        <Info className="h-10 w-10 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-xl font-bold text-blue-900">
            Možete dodati još slika danas
          </p>
          
          {/* OGROMNI BROJ - najvažnija informacija */}
          <div className="mt-3 text-center py-4 bg-white rounded-lg border-2 border-blue-200">
            <p className="text-base text-blue-700 mb-1">Preostalo danas:</p>
            <p className="text-6xl font-bold text-blue-600">
              {uploadLimitInfo.remainingToday}
            </p>
          </div>

          {/* Napomena */}
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-base text-blue-900">
              💡 <span className="font-bold">Novi korisnici:</span> 1 slika dnevno
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoryLimitInfo