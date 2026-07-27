/**
 * Carsai Mozambique - SweetAlert2 Utility Wrapper
 *
 * Provides consistent alert styling across the application.
 * Uses sweetalert2 for confirmation dialogs, success/error feedback.
 */

import Swal from 'sweetalert2'

// ── Shared theme configuration ──

const CARSAI_THEME = {
  customClass: {
    confirmButton: 'swal2-confirm-btn',
    cancelButton: 'swal2-cancel-btn',
    popup: 'swal2-popup-carsai',
  },
  buttonsStyling: false,
}

// ── Confirmation dialog for destructive actions (delete, etc.) ──

export const confirmAction = (title: string, text: string): Promise<boolean> =>
  Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    ...CARSAI_THEME,
  }).then((result) => result.isConfirmed)

// ── Success notification ──

export const successAlert = (title: string, text?: string): Promise<void> =>
  Swal.fire({
    title,
    text: text || '',
    icon: 'success',
    confirmButtonColor: '#10b981',
    timer: 2000,
    timerProgressBar: true,
    ...CARSAI_THEME,
  }).then(() => {})

// ── Error notification ──

export const errorAlert = (title: string, text?: string): Promise<void> =>
  Swal.fire({
    title,
    text: text || '',
    icon: 'error',
    confirmButtonColor: '#ef4444',
    ...CARSAI_THEME,
  }).then(() => {})

// ── Info notification ──

export const infoAlert = (title: string, text?: string): Promise<void> =>
  Swal.fire({
    title,
    text: text || '',
    icon: 'info',
    confirmButtonColor: '#10b981',
    ...CARSAI_THEME,
  }).then(() => {})

// ── Delete confirmation with specific wording ──

export const confirmDelete = (itemName: string): Promise<boolean> =>
  confirmAction(
    `Delete ${itemName}?`,
    `This action cannot be undone. The ${itemName} will be permanently removed.`
  )
