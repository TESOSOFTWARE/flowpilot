'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type CustomField = {
  id: string
  name: string
  label: string
  fieldType: string
  options: string | null
  required: boolean
}

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'ENUM', 'BOOLEAN']

export default function CustomFieldManager() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    fieldType: 'TEXT',
    options: '',
    required: false
  })

  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchFields()
  }, [])

  async function fetchFields() {
    try {
      const res = await fetch('/api/organization/custom-fields')
      const result = await res.json()
      if (result.success) setFields(result.data)
    } catch (error) {
      toast.error('Failed to fetch custom fields')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = editingField 
      ? `/api/organization/custom-fields/${editingField.id}`
      : '/api/organization/custom-fields'
    const method = editingField ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await res.json()
      if (result.success) {
        toast.success(editingField ? 'Field updated' : 'Field added')
        setIsModalOpen(false)
        setEditingField(null)
        setFormData({ name: '', label: '', fieldType: 'TEXT', options: '', required: false })
        fetchFields()
      } else {
        toast.error(result.error || 'Failed to save field')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!fieldToDelete) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/organization/custom-fields/${fieldToDelete}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast.success('Field deleted')
        setFieldToDelete(null)
        fetchFields()
      } else {
        toast.error(result.error || 'Failed to delete field')
      }
    } catch (error) {
      toast.error('Failed to delete field')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(field: CustomField) {
    setEditingField(field)
    setFormData({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      options: field.options || '',
      required: field.required
    })
    setIsModalOpen(true)
  }

  return (
    <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">dynamic_form</span>
            Custom Project Fields
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Define additional fields that appear on every project.</p>
        </div>
        <button 
          onClick={() => {
            setEditingField(null)
            setFormData({ name: '', label: '', fieldType: 'TEXT', options: '', required: false })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span> Add Field
        </button>
      </div>

      <div className="space-y-3">
        {loading && fields.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : fields.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-outline-variant/30 rounded-xl p-12 text-center group transition-all hover:bg-white/80">
            <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary/40 transition-all mb-3 block">post_add</span>
            <p className="text-sm text-on-surface-variant italic font-medium">No custom fields defined yet.</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">Add your first custom field to get started.</p>
          </div>
        ) : (
          fields.map(field => (
            <div key={field.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-outline-variant/10 hover:border-primary/20 transition-all group shadow-sm">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors">drag_indicator</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{field.label}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold opacity-70">{field.name} · {field.required ? 'Required' : 'Optional'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold tracking-tight">{field.fieldType}</span>
                <button 
                  onClick={() => openEdit(field)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button 
                  onClick={() => setFieldToDelete(field.id)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logic for modals handled below */}

      {/* Delete Confirmation Modal */}
      {fieldToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-outline-variant/20 text-center">
            <div className="w-16 h-16 bg-error-container/30 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Custom Field?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              This will permanently delete this field and all associated values from your projects. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFieldToDelete(null)}
                className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 py-3 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-error/20 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Field'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative border border-outline-variant/20">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingField ? 'edit_note' : 'add_circle'}</span>
              {editingField ? 'Edit Field' : 'Add Custom Field'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Field Name (ID)</label>
                <input
                  type="text"
                  placeholder="e.g. site_location (no spaces)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  required
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all border-none outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. Site Location"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  required
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all border-none outline-none font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Type</label>
                  <select
                    value={formData.fieldType}
                    onChange={e => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all border-none outline-none font-medium cursor-pointer"
                  >
                    {FIELD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="flex items-end h-full">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface-container-low rounded-xl w-full border border-transparent hover:border-primary/20 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={e => setFormData({ ...formData, required: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/40 transition-all"
                    />
                    <span className="text-sm font-semibold">Required</span>
                  </label>
                </div>
              </div>
              {formData.fieldType === 'ENUM' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Options (comma separated)</label>
                  <textarea
                    placeholder="Option 1, Option 2, Option 3"
                    value={formData.options}
                    onChange={e => setFormData({ ...formData, options: e.target.value })}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all border-none outline-none font-medium min-h-[100px]"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingField ? 'Update Field' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
