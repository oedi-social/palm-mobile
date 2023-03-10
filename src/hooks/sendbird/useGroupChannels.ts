import { useSendbirdChat } from '@sendbird/uikit-react-native'
import { useGroupChannelList } from '@sendbird/uikit-chat-hooks'
import { GroupChannel } from '@sendbird/chat/groupChannel'
import useAuth from '../independent/useAuth'

export type useGroupChannelsReturn = {
  loading: boolean
  refreshing: boolean
  refresh: () => Promise<void>
  groupChannels: GroupChannel[]
  next: () => Promise<void>
}

export const useGroupChannels = (
  channelUrls: string[]
): useGroupChannelsReturn => {
  const { sdk } = useSendbirdChat()
  const { user } = useAuth()
  return useGroupChannelList(sdk, user?.address, {
    queryCreator: () =>
      sdk.groupChannel.createMyGroupChannelListQuery({
        channelUrlsFilter: channelUrls,
      }),
  })
}
