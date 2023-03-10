import { User } from 'types'

import useUserNftList, { UseUserNftListReturn } from 'hooks/api/useUserNftList'
import useAuth from 'hooks/independent/useAuth'
import useUserBalance, {
  UseUserBalanceReturn,
} from 'hooks/independent/useUserBalance'

export type UseMyPageMainReturn = {
  user?: User
  useMyBalanceReturn: UseUserBalanceReturn
  useMyNftListReturn: UseUserNftListReturn
}

const useMyPageMain = (): UseMyPageMainReturn => {
  const { user } = useAuth()

  const useMyNftListReturn = useUserNftList({
    userAddress: user?.address,
  })

  const useMyBalanceReturn = useUserBalance({ address: user?.address })

  return { user, useMyBalanceReturn, useMyNftListReturn }
}

export default useMyPageMain
