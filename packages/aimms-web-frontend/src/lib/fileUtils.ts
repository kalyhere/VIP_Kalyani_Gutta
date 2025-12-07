/**
 * Creates an object URL from a base64 encoded string
 * @param base64Data The base64 encoded data
 * @param mimeType The MIME type of the data
 * @returns A URL object that can be used to reference the data
 */
export const createObjectUrlFromBase64 = (base64Data: string, mimeType: string): string => {
  if (!base64Data) return ""

  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

/**
 * Downloads a file from a URL
 * @param url The URL of the file to download
 * @param filename The name to save the file as
 */
export const downloadFile = (url: string, filename: string): void => {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // If the URL was created with URL.createObjectURL, we should revoke it
  // However, we can't know for sure if it was, so we leave that to the caller
}

/**
 * Downloads JSON data as a file
 * @param data The data to download
 * @param fileName The name to save the file as (without extension)
 */
export const downloadJson = (data: any, fileName: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  downloadFile(url, `${fileName}.json`)
  URL.revokeObjectURL(url)
}
