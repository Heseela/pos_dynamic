'use client'

import toast from 'react-hot-toast'

export const useConfirmToast = () => {
  const confirmAction = (message, onConfirm, onCancel) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-[#18181b] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-white/5`}
        >
          <div className="flex-1 w-0 p-5">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">Confirm Action</p>
                <p className="mt-1 text-sm text-gray-400">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-white/5">
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                await new Promise(resolve => setTimeout(resolve, 150))
                if (onConfirm) await onConfirm()
              }}
              className="w-full border-none rounded-none rounded-r-lg px-4 py-5 flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-white/5 focus:outline-none transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                if (onCancel) onCancel()
              }}
              className="w-full border-none rounded-none px-4 py-5 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-white/5 focus:outline-none transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 3500 }
    )
  }

  return { confirmAction }
}
