import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Eye, EyeOff, UploadCloud } from 'lucide-react'
import api, { assetUrl } from '../../api/axios'
import Skeleton from '../../components/Skeleton'
import { copyToClipboard } from '../../utils/copyToClipboard'

const emptyProfile = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  profilePhoto: '',
  documents: {
    aadharCard: { number: '', fileUrl: '' },
    panCard: { number: '', fileUrl: '' },
    cancelledCheque: { fileUrl: '' },
    agreementLetter: { fileUrl: '' }
  },
  bankDetails: {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Savings'
  }
}

const docLabels = {
  aadharCard: 'Aadhar Card',
  panCard: 'PAN Card',
  cancelledCheque: 'Cancelled Cheque',
  agreementLetter: 'Agreement Letter'
}

const mergeProfile = (profile) => ({
  ...emptyProfile,
  ...profile,
  documents: {
    ...emptyProfile.documents,
    ...(profile?.documents || {}),
    aadharCard: { ...emptyProfile.documents.aadharCard, ...(profile?.documents?.aadharCard || {}) },
    panCard: { ...emptyProfile.documents.panCard, ...(profile?.documents?.panCard || {}) },
    cancelledCheque: { ...emptyProfile.documents.cancelledCheque, ...(profile?.documents?.cancelledCheque || {}) },
    agreementLetter: { ...emptyProfile.documents.agreementLetter, ...(profile?.documents?.agreementLetter || {}) }
  },
  bankDetails: {
    ...emptyProfile.bankDetails,
    ...(profile?.bankDetails || {})
  }
})

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile)
  const [confirmAccount, setConfirmAccount] = useState('')
  const [showAccount, setShowAccount] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [advisorCode, setAdvisorCode] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/ba/profile')
      setProfile(mergeProfile(data))
      setAdvisorCode(data.advisorCode || '')
      setConfirmAccount(data.bankDetails?.accountNumber || '')
      setLoading(false)
    }

    load()
  }, [])

  const completion = useMemo(() => {
    const personal = Boolean(profile.fullName && profile.phone && profile.email && profile.address && profile.city && profile.profilePhoto)
    const aadhar = Boolean(profile.documents.aadharCard.number?.match(/^\d{12}$/) && profile.documents.aadharCard.fileUrl)
    const pan = Boolean(profile.documents.panCard.number?.match(/^[A-Z0-9]{10}$/) && profile.documents.panCard.fileUrl)
    const cheque = Boolean(profile.documents.cancelledCheque.fileUrl)
    const agreement = Boolean(profile.documents.agreementLetter.fileUrl)
    const bank = Boolean(
      profile.bankDetails.accountHolderName &&
        profile.bankDetails.bankName &&
        profile.bankDetails.accountNumber &&
        profile.bankDetails.ifscCode &&
        profile.bankDetails.branchName &&
        profile.bankDetails.accountType
    )

    return [
      ['Personal Info', personal],
      ['Aadhar Card', aadhar],
      ['PAN Card', pan],
      ['Cancelled Cheque', cheque],
      ['Agreement Letter', agreement],
      ['Bank Details', bank]
    ]
  }, [profile])

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const updateDoc = (doc, field, value) => {
    setProfile((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [doc]: {
          ...current.documents[doc],
          [field]: doc === 'panCard' && field === 'number' ? value.toUpperCase() : value
        }
      }
    }))
  }

  const updateBank = (field, value) => {
    setProfile((current) => ({
      ...current,
      bankDetails: {
        ...current.bankDetails,
        [field]: field === 'ifscCode' ? value.toUpperCase() : value
      }
    }))
  }

  const uploadFile = async (docType, file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('docType', docType)
    formData.append('file', file)

    setUploading(docType)
    try {
      const { data } = await api.post('/ba/profile/upload', formData)
      setProfile(mergeProfile(data.profile))
      toast.success('File uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading('')
    }
  }

  const fillIfsc = async () => {
    const code = profile.bankDetails.ifscCode?.trim()
    if (!code) return

    try {
      const response = await fetch(`https://ifsc.razorpay.com/${code}`)

      if (!response.ok) return

      const data = await response.json()
      setProfile((current) => ({
        ...current,
        bankDetails: {
          ...current.bankDetails,
          bankName: data.BANK || current.bankDetails.bankName,
          branchName: data.BRANCH || current.bankDetails.branchName
        }
      }))
    } catch (_error) {
      toast.error('Could not fetch IFSC details')
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()

    if (profile.bankDetails.accountNumber && profile.bankDetails.accountNumber !== confirmAccount) {
      toast.error('Account numbers do not match')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        documents: profile.documents,
        bankDetails: profile.bankDetails
      }
      const { data } = await api.put('/ba/profile', payload)
      setProfile(mergeProfile(data))
      toast.success('Profile saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton rows={10} />

  const publicApplyBase = (import.meta.env.VITE_PUBLIC_APPLY_URL || `${window.location.origin}/apply`).replace(/\/$/, '')
  const shareLink = `${publicApplyBase}/${advisorCode}`
  const copyText = async (value, successMessage) => {
    try {
      const copied = await copyToClipboard(value)
      toast[copied ? 'success' : 'error'](copied ? successMessage : 'Copy is not supported in this browser')
    } catch (_error) {
      toast.error('Could not copy')
    }
  }

  return (
    <form onSubmit={saveProfile} className="space-y-4 sm:space-y-6">
      <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Your Advisor Code</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-cyan-200">
          <p className="font-mono text-lg font-bold text-slate-900">{advisorCode || 'Not assigned yet'}</p>
          <button type="button" onClick={() => copyText(advisorCode, 'Code copied!')} className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white sm:w-auto">Copy code</button>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">Public candidate website link:</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-cyan-200">
          <p className="break-all text-sm text-slate-700">{shareLink}</p>
          <button type="button" onClick={() => copyText(shareLink, 'Link copied!')} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white sm:w-auto">Copy link</button>
        </div>
      </section>

      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Complete your profile, documents, and payout bank details.</p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {completion.map(([label, done]) => (
            <div key={label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold">
              <CheckCircle2 className={`h-4 w-4 ${done ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className={done ? 'text-slate-800' : 'text-slate-500'}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Personal Info</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
          <div>
            <div className="mb-3 h-36 w-36 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              {profile.profilePhoto ? (
                <img src={assetUrl(profile.profilePhoto)} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
              )}
            </div>
            <label className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto">
              <UploadCloud className="h-4 w-4" />
              {uploading === 'profilePhoto' ? 'Uploading...' : 'Upload'}
              <input type="file" className="sr-only" accept="image/*" onChange={(event) => uploadFile('profilePhoto', event.target.files?.[0])} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required value={profile.fullName} onChange={(value) => updateField('fullName', value)} />
            <Field label="Phone Number" required value={profile.phone} onChange={(value) => updateField('phone', value)} />
            <Field label="Email" required readOnly value={profile.email} onChange={() => {}} />
            <Field label="City" required value={profile.city} onChange={(value) => updateField('city', value)} />
            <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
              Address <span className="text-rose-500">*</span>
              <textarea
                value={profile.address}
                onChange={(event) => updateField('address', event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Documents</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Object.entries(docLabels).map(([docType, label]) => (
            <div key={docType} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{label}</h3>
                {profile.documents[docType]?.fileUrl && (
                  <a href={assetUrl(profile.documents[docType].fileUrl)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                    View
                  </a>
                )}
              </div>

              {docType === 'aadharCard' && (
                <Field label="Aadhar Number" value={profile.documents.aadharCard.number || ''} onChange={(value) => updateDoc('aadharCard', 'number', value.replace(/\D/g, '').slice(0, 12))} />
              )}
              {docType === 'panCard' && (
                <Field label="PAN Number" value={profile.documents.panCard.number || ''} onChange={(value) => updateDoc('panCard', 'number', value.slice(0, 10))} />
              )}

              <label className="mt-4 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 text-sm font-semibold text-white hover:bg-orange-600 sm:w-auto">
                <UploadCloud className="h-4 w-4" />
                {uploading === docType ? 'Uploading...' : profile.documents[docType]?.fileUrl ? 'Replace File' : 'Upload File'}
                <input
                  type="file"
                  className="sr-only"
                  accept={docType === 'agreementLetter' ? '.pdf,application/pdf' : 'image/*,.pdf'}
                  onChange={(event) => uploadFile(docType, event.target.files?.[0])}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Bank Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Account Holder Name" required value={profile.bankDetails.accountHolderName} onChange={(value) => updateBank('accountHolderName', value)} />
          <Field label="Bank Name" required value={profile.bankDetails.bankName} onChange={(value) => updateBank('bankName', value)} />
          <label className="text-sm font-semibold text-slate-700">
            Account Number <span className="text-rose-500">*</span>
            <div className="mt-1 flex rounded-lg border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-cyan-100">
              <input
                type={showAccount ? 'text' : 'password'}
                value={profile.bankDetails.accountNumber}
                onChange={(event) => updateBank('accountNumber', event.target.value)}
                className="min-w-0 flex-1 rounded-l-lg px-3 py-2 outline-none"
              />
              <button type="button" onClick={() => setShowAccount((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center text-slate-500" aria-label="Toggle account visibility">
                {showAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <Field label="Confirm Account Number" required type={showAccount ? 'text' : 'password'} value={confirmAccount} onChange={setConfirmAccount} />
          <Field label="IFSC Code" required value={profile.bankDetails.ifscCode} onBlur={fillIfsc} onChange={(value) => updateBank('ifscCode', value)} />
          <Field label="Branch Name" required value={profile.bankDetails.branchName} onChange={(value) => updateBank('branchName', value)} />
          <div className="text-sm font-semibold text-slate-700">
            Account Type <span className="text-rose-500">*</span>
            <div className="mt-2 flex gap-3">
              {['Savings', 'Current'].map((type) => (
                <label key={type} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
                  <input
                    type="radio"
                    name="accountType"
                    checked={profile.bankDetails.accountType === type}
                    onChange={() => updateBank('accountType', type)}
                    className="h-4 w-4 text-sky-600"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}

function Field({ label, required, value, onChange, type = 'text', readOnly = false, onBlur }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 ${readOnly ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
      />
    </label>
  )
}
