import { UTIL } from 'consts'
import useReactQuery from 'hooks/complex/useReactQuery'
import useNft from 'hooks/contract/useNft'
import { fetchNftImage } from 'libs/fetchTokenUri'
import { ContractAddr, QueryKeyEnum } from 'types'

export type UseNftImageReturn = {
  uri?: string
}

const useNftImage = ({
  nftContract,
  tokenId,
  metadata,
}: {
  nftContract: ContractAddr
  tokenId: string
  metadata?: string
}): UseNftImageReturn => {
  const { tokenURI } = useNft({ nftContract })
  const { data: tokenUri = '' } = useReactQuery(
    [QueryKeyEnum.NFT_TOKEN_URI, nftContract, tokenId],
    async () => {
      const uri = await tokenURI({ tokenId })
      if (uri && UTIL.isURL(uri.trim())) {
        return uri.trim()
      }
    }
  )

  const { data: uri } = useReactQuery(
    [QueryKeyEnum.MORALIS_NFT_IMAGE, tokenUri, metadata],
    () => fetchNftImage({ metadata, tokenUri }),
    { enabled: !!tokenUri }
  )

  return { uri }
}

export default useNftImage
