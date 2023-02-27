import axios from 'axios'
import { UTIL } from 'consts'
import { fixIpfsURL } from './ipfs'
import { unescape } from './utils'

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
      return unescape(fixIpfsURL(ret))
    }
  }

  if (tokenUri) {
    try {
      const fixedUrl = fixIpfsURL(tokenUri)
      const fetched = await fetch(fixedUrl)
      const blob = await fetched.blob()
      if (blob.type.startsWith('image')) {
        return fixedUrl
      }

      const axiosData = await axios.get(fixedUrl)
      const jsonData = axiosData.data
      const ret = jsonData?.image || jsonData?.image_url || jsonData?.image_data
      if (ret) {
        return unescape(fixIpfsURL(ret))
      }
    } catch (e) {
      console.error('fetchTokenUri failed: ', metadata, tokenUri, e)
    }
  }

  return require('../assets/no_img.png')
}
