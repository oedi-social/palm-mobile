import { UTIL } from 'consts'
import { resolveIpfsUri } from './ipfs'
import { unescape } from './utils'

export const fixURL = (uri: string): string => {
  if (uri.startsWith('https://ipfs.moralis.io:2053/ipfs/')) {
    uri = uri.replace('https://ipfs.moralis.io:2053/ipfs/', 'ipfs://')
  } else if (uri.startsWith('https://ipfs.io/ipfs/')) {
    uri = uri.replace('https://ipfs.io/ipfs/', 'ipfs://')
  } else if (uri.match(/^[a-zA-Z0-9_]+$/)) {
    // uri is just ipfs cid
    uri = `ipfs://${uri}`
  }
  return resolveIpfsUri(uri) || uri
}

export const fetchNftImage = async ({
  metadata,
  tokenUri,
}: {
  metadata?: string
  tokenUri: string
}): Promise<string> => {
  if (metadata) {
    const metadataJson = UTIL.jsonTryParse<{
      image?: string
      image_url?: string
      image_data?: string // svg+xml
    }>(metadata)
    const ret =
      metadataJson?.image || metadataJson?.image_url || metadataJson?.image_data
    if (ret) {
      return unescape(fixURL(ret))
    }
  }

  if (tokenUri) {
    try {
      const fixedUrl = fixURL(tokenUri)
      const fetched = await fetch(fixedUrl)
      const blob = await fetched.blob()
      if (blob.type.startsWith('image')) {
        return fixedUrl
      }

      const jsonData = await fetched.json()
      const ret = jsonData?.image || jsonData?.image_url || jsonData?.image_data
      if (ret) {
        return unescape(ret)
      }
    } catch (e) {
      console.error('fetchTokenUri failed: ', metadata, tokenUri, e)
    }
  }

  return require('../assets/no_img.png')
}
