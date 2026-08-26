const CLOUDINARY_CLOUD_NAME = 'sgbbc3pv'

declare global {
  interface Window {
    cloudinary: any
  }
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'wedding_invitations')
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.secure_url) {
          resolve(data.secure_url)
        } else {
          reject(new Error('Upload failed: ' + data.error?.message))
        }
      })
      .catch(error => reject(error))
  })
}

export function openCloudinaryWidget(
  onSuccess: (url: string) => void,
  onError?: (error: any) => void
) {
  if (!window.cloudinary) {
    console.error('Cloudinary widget not loaded')
    return
  }

  window.cloudinary.openUploadWidget(
    {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: 'wedding_invitations',
      sources: ['local', 'url'],
      multiple: false,
      folder: 'wedding_invitations',
      resourceType: 'image',
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxFileSize: 5242880,
      showAdvancedOptions: false,
      cropping: true,
      croppingAspectRatio: 1,
      showCompletedButton: true,
      theme: 'white',
    },
    (error: any, result: any) => {
      if (error) {
        onError?.(error)
        return
      }

      if (result.event === 'success') {
        onSuccess(result.info.secure_url)
      }
    }
  )
}
