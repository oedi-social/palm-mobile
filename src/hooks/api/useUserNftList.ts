import { useMemo } from 'react'
import _ from 'lodash'
import { useInfiniteQuery } from 'react-query'

import { ApiEnum, ContractAddr, Moralis } from 'types'

import useNetwork from '../complex/useNetwork'
import useApi from '../complex/useApi'
import apiV1Fabricator from 'libs/apiV1Fabricator'

export type UseUserNftListReturn = {
  nftList: Moralis.NftItem[]
  fetchNextPage: () => void
  hasNextPage: boolean
}

const useUserNftList = ({
  userAddress,
  limit,
}: {
  userAddress?: ContractAddr
  limit?: number
}): UseUserNftListReturn => {
  const { connectedNetworkId } = useNetwork()
  const { getApi } = useApi()

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery(
    [ApiEnum.ASSETS, userAddress],
    async ({ pageParam = '' }) => {
      if (userAddress) {
        const path = apiV1Fabricator[ApiEnum.ASSETS].get({
          userAddress,
          connectedNetworkId,
          limit,
          cursor: pageParam,
        })
        const fetchResult = await getApi<ApiEnum.ASSETS>({ path })

        if (fetchResult.success) {
          return fetchResult.data
        }
      }
      return {
        page: 0,
        page_size: 0,
        cursor: null,
        result: [] as Moralis.NftItem[],
      }
    },
    {
      getNextPageParam: lastPage => lastPage.cursor,
      keepPreviousData: true,
    }
  )

  const nftList = useMemo(
    () => _.flatten(data?.pages.map(x => x.result)),
    [data]
  )

  return { nftList, fetchNextPage, hasNextPage }
}

export default useUserNftList
