import { useSendbirdChat } from '@sendbird/uikit-react-native'
import { useGroupChannel } from '@sendbird/uikit-chat-hooks'
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'

import useReactQuery from 'hooks/complex/useReactQuery'
import { ContractAddr, FbChannelField, FirestoreKeyEnum } from 'types'
import { useMemo, useState } from 'react'

export type UseFsChannelReturn = {
  fsChannel?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>
  fsChannelField?: FbChannelField
  updateGatingToken: (gatingToken: ContractAddr) => Promise<void>
  isFetching: boolean
}

const useFsChannel = ({
  channelUrl,
}: {
  channelUrl?: string
}): UseFsChannelReturn => {
  const [isUpdating, setIsUpdating] = useState(false)

  const { sdk } = useSendbirdChat()
  const { channel } = useGroupChannel(sdk, channelUrl || '')

  const { data: fsChannel, isFetching: isFetchingChannel } = useReactQuery(
    [FirestoreKeyEnum.Channel, channelUrl],
    async () => {
      if (channel) {
        const _fsChannel = firestore().collection('channels').doc(channelUrl)
        const channelDoc = await _fsChannel.get()

        if (!channelDoc.exists) {
          const fbChannelField: FbChannelField = {
            url: channel.url,
            channelType: channel.channelType,
          }
          await _fsChannel.set(fbChannelField)
        }

        return _fsChannel
      }
    },
    {
      enabled: !!channel,
    }
  )

  const {
    data: fsChannelField,
    refetch: refetchField,
    isFetching: isFetchingField,
  } = useReactQuery(
    [FirestoreKeyEnum.ChannelField, fsChannel?.id],
    async () => {
      if (fsChannel) {
        return (await fsChannel?.get()).data() as FbChannelField
      }
    },
    {
      enabled: !!fsChannel,
    }
  )

  const isFetching = useMemo(
    () => isUpdating || isFetchingChannel || isFetchingField,
    [isUpdating, isFetchingChannel, isFetchingField]
  )

  const updateGatingToken = async (
    gatingToken: ContractAddr
  ): Promise<void> => {
    setIsUpdating(true)
    await fsChannel?.update({ gatingToken })
    refetchField()
    setIsUpdating(false)
  }

  return { fsChannel, fsChannelField, updateGatingToken, isFetching }
}

export default useFsChannel
