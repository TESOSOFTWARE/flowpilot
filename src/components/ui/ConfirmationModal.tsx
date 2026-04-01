'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  isLoading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-outline/10">
                <div className="sm:flex sm:items-start">
                  {isDanger && (
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error/10 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-error" aria-hidden="true" />
                    </div>
                  )}
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-on-surface">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-on-surface-variant">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 sm:flex sm:flex-row-reverse sm:gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    className={`inline-flex w-full justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all sm:w-auto ${
                      isDanger 
                        ? 'bg-gradient-to-br from-error to-error/80 hover:opacity-90' 
                        : 'bg-gradient-to-br from-primary to-primary/80 hover:opacity-90'
                    } disabled:opacity-50`}
                    onClick={onConfirm}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                        Processing...
                      </span>
                    ) : confirmText}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-surface-container px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
