'use client'

import toast from 'react-hot-toast'

interface ShareButtonProps {
  projectId: string
  className?: string
}

export default function ShareButton({ projectId, className }: ShareButtonProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/projects/${projectId}`
    navigator.clipboard.writeText(url)
    toast.success('Project link copied to clipboard!')
  }

  return (
    <button 
      onClick={handleShare}
      className={className}
    >
      <span className="material-symbols-outlined text-lg">share</span> Share
    </button>
  )
}
