import React, { ReactElement } from 'react'
import { useGroupChannel } from '@sendbird/uikit-chat-hooks'
import { SendbirdMessage } from '@sendbird/uikit-utils'

import {
  createGroupChannelFragment,
  useSendbirdChat,
} from '@sendbird/uikit-react-native'

import { useAppNavigation } from 'hooks/useAppNavigation'
import { Routes } from 'libs/navigation'

import GroupChannelInput from './GroupChannelInput'
import GroupChannelMessageList from './GroupChannelMessageList'
import { GroupChannel } from '@sendbird/chat/groupChannel'
import MessageRenderer from 'components/molecules/MessageRenderer'

const GroupChannelFragment = createGroupChannelFragment({
  Input: GroupChannelInput,
  MessageList: GroupChannelMessageList,
})

const GroupChannelScreen = (): ReactElement => {
  const { navigation, params } = useAppNavigation<Routes.GroupChannel>()

  const { sdk } = useSendbirdChat()
  const { channel } = useGroupChannel(sdk, params.channelUrl)
  if (!channel) {
    return <></>
  }

  return (
    <>
      <GroupChannelFragment
        channel={channel}
        onPressMediaMessage={(fileMessage, deleteMessage): void => {
          const nftMessageData = JSON.parse(fileMessage.data || '')
          if (fileMessage.customType === 'sell' && nftMessageData.nonce) {
            navigation.navigate(Routes.ZxNftDetail, {
              nonce: nftMessageData.nonce,
            })
            return
          } else if (
            fileMessage.customType &&
            nftMessageData.nft_contract &&
            nftMessageData.token_id
          ) {
            navigation.navigate(Routes.NftDetail, {
              nftContract: nftMessageData.nft_contract,
              tokenId: nftMessageData.token_id,
            })
            return
          }

          // Navigate to media viewer
          navigation.navigate(Routes.FileViewer, {
            serializedFileMessage: fileMessage.serialize(),
            deleteMessage,
          })
        }}
        onChannelDeleted={(): void => {
          // Should leave channel, navigate to channel list
          navigation.navigate(Routes.GroupChannelList)
        }}
        onPressHeaderLeft={(): void => {
          // Navigate back
          navigation.goBack()
        }}
        onPressHeaderRight={(): void => {
          // Navigate to group channel settings
          navigation.push(Routes.GroupChannelSettings, params)
        }}
        renderMessage={(props: {
          message: SendbirdMessage
          prevMessage?: SendbirdMessage | undefined
          nextMessage?: SendbirdMessage | undefined
          onPress?: (() => void) | undefined
          onLongPress?: (() => void) | undefined
          channel: GroupChannel
          currentUserId?: string | undefined
          enableMessageGrouping: boolean
        }): ReactElement | null => {
          return <MessageRenderer {...props} />
        }}
      />
    </>
  )
}

export default GroupChannelScreen
