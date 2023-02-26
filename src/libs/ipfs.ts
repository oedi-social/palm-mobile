import { IPFS } from 'consts'
import * as mime from 'mime'

export function resolveIpfsUri(
  uri?: string,
  options = IPFS.defaultIpfsResolverOptions
): string | undefined {
  if (!uri) {
    return undefined
  }
  if (uri.startsWith && uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', options.gatewayUrl)
  }
  return uri
}

export async function resolveMimeType(
  url?: string
): Promise<string | undefined> {
  if (!url) {
    return undefined
  }
  const mimeType = mime.getType(url)
  if (mimeType) {
    return mimeType
  }

  if (url?.startsWith('data:image/svg+xml') || url?.endsWith('.svg')) {
    return 'image/svg+xml'
  } else if (url?.endsWith('.jpg') || url?.endsWith('.jpeg')) {
    return 'image/jpeg'
  } else if (url?.endsWith('.png')) {
    return 'image/png'
  }

  const res = await fetch(url, {
    method: 'HEAD',
  })
  if (res.ok && res.headers.has('content-type')) {
    return res.headers.get('content-type') ?? undefined
  }

  // we failed to resolve the mime type, return null
  return undefined
}