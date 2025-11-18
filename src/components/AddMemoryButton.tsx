import { Plus, Lock } from "lucide-react"
import { Button } from "./ui/button"

interface UploadLimitInfo {
  canUpload: boolean
  uploadsToday: number
  remainingToday: number
  userTier: string
  dailyLimit: number
  nextTierInfo?: string
}

interface AddMemoryButtonProps {
  uploadLimitInfo: UploadLimitInfo | null
  onClick: () => void
  loading?: boolean
}

export const AddMemoryButton = ({ 
  uploadLimitInfo, 
  onClick, 
  loading = false 
}: AddMemoryButtonProps) => {
  
  const isDisabled = loading || !!(uploadLimitInfo && !uploadLimitInfo.canUpload)

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      size="lg"
      className={`
        w-full 
        flex items-center justify-center gap-3
        text-xl
        px-8 py-6
        font-bold
        rounded-xl
        transition-all duration-200
        ${isDisabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' 
          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
        }
      `}
    >
      {isDisabled ? (
        <>
          <Lock className="h-7 w-7 flex-shrink-0" />
          <span>Ne možete dodati sliku</span>
        </>
      ) : (
        <>
          <Plus className="h-7 w-7 flex-shrink-0" />
          <span>Dodaj sliku</span>
        </>
      )}
    </Button>
  )
}

export default AddMemoryButton