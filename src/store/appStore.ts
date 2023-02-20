import { atom } from 'recoil'
import { User } from 'types'
import storeKeys from './storeKeys'

const user = atom<User | undefined>({
  key: storeKeys.app.user,
  default: undefined,
})

export default {
  user,
}
