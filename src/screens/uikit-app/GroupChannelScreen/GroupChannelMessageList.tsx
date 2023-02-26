import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ListRenderItem, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { BottomSheetItem } from '@sendbird/uikit-react-native-foundation'
import {
  ChannelFrozenBanner,
  createStyleSheet,
  useAlert,
  useBottomSheet,
  useToast,
  useUIKitTheme,
} from '@sendbird/uikit-react-native-foundation'
import type {
  SendbirdFileMessage,
  SendbirdMessage,
  SendbirdUserMessage,
} from '@sendbird/uikit-utils'
import {
  Logger,
  getAvailableUriFromFileMessage,
  getFileExtension,
  getFileType,
  isMyMessage,
  messageKeyExtractor,
  shouldRenderReaction,
  toMegabyte,
  useFreshCallback,
} from '@sendbird/uikit-utils'

import SBUUtils from '@sendbird/uikit-react-native/src/libs/SBUUtils'
import {
  GroupChannelContexts,
  GroupChannelProps,
  ReactionAddons,
  useLocalization,
  usePlatformService,
  useSendbirdChat,
} from '@sendbird/uikit-react-native'
import ChatFlatList, {
  ChatFlatListRef,
} from '@sendbird/uikit-react-native/src/components/ChatFlatList'
import { DEPRECATION_WARNING } from '@sendbird/uikit-react-native/src/constants'
import { COLOR } from 'consts'

const HANDLE_NEXT_MSG_SEPARATELY = Platform.select({ default: true })

const GroupChannelMessageList = ({
  currentUserId,
  channel,
  messages,
  renderMessage,
  nextMessages,
  newMessagesFromMembers,
  onBottomReached,
  onTopReached,
  renderNewMessagesButton,
  renderScrollToBottomButton,
  onResendFailedMessage,
  onDeleteMessage,
  onPressImageMessage,
  onPressMediaMessage,
  flatListProps,
  enableMessageGrouping,
}: GroupChannelProps['MessageList']): ReactElement => {
  const { STRINGS } = useLocalization()
  const { colors } = useUIKitTheme()
  const { left, right } = useSafeAreaInsets()
  const [scrollLeaveBottom, setScrollLeaveBottom] = useState(false)
  const scrollRef = useRef<ChatFlatListRef>(null)
  const [newMessagesInternalBuffer, setNewMessagesInternalBuffer] = useState(
    () => newMessagesFromMembers
  )
  const getMessagePressActions = useGetMessagePressActions({
    channel,
    currentUserId,
    onDeleteMessage,
    onResendFailedMessage,
    onPressImageMessage,
    onPressMediaMessage,
  })

  const safeAreaLayout = { paddingLeft: left, paddingRight: right }

  const renderItem: ListRenderItem<SendbirdMessage> = useFreshCallback(
    ({ item, index }) => {
      const { onPress, onLongPress } = getMessagePressActions(item)
      return renderMessage({
        message: item,
        prevMessage: messages[index + 1],
        nextMessage: messages[index - 1],
        onPress,
        onLongPress,
        enableMessageGrouping,
        channel,
        currentUserId,
      })
    }
  )

  if (!HANDLE_NEXT_MSG_SEPARATELY) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (newMessagesInternalBuffer.length !== 0) {
        setNewMessagesInternalBuffer(prev =>
          prev.concat(newMessagesFromMembers)
        )
      }
      onBottomReached()
    }, [newMessagesFromMembers])
  }

  const onLeaveScrollBottom = useCallback((val: boolean) => {
    if (!HANDLE_NEXT_MSG_SEPARATELY) {
      setNewMessagesInternalBuffer([])
    }
    setScrollLeaveBottom(val)
  }, [])

  return (
    <View
      style={[{ flex: 1, backgroundColor: colors.background }, safeAreaLayout]}>
      {channel.isFrozen && (
        <ChannelFrozenBanner
          style={styles.frozenBanner}
          text={STRINGS.GROUP_CHANNEL.LIST_BANNER_FROZEN}
        />
      )}
      <ChatFlatList
        nextMessages={nextMessages}
        onBottomReached={onBottomReached}
        onTopReached={onTopReached}
        onLeaveScrollBottom={onLeaveScrollBottom}
        currentUserId={currentUserId}
        {...flatListProps}
        key={`group-channel-messages-${channel.url}`}
        ref={scrollRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={messageKeyExtractor}
        contentContainerStyle={[
          // { minHeight: '100%', justifyContent: 'flex-end' },
          channel.isFrozen && styles.frozenListPadding,
          flatListProps?.contentContainerStyle,
          { backgroundColor: COLOR.primary._100 },
        ]}
      />
      {renderNewMessagesButton && (
        <View style={[styles.newMsgButton, safeAreaLayout]}>
          {renderNewMessagesButton({
            visible: scrollLeaveBottom,
            onPress: () => scrollRef.current?.scrollToBottom(false),
            newMessages: !HANDLE_NEXT_MSG_SEPARATELY
              ? newMessagesInternalBuffer
              : newMessagesFromMembers,
          })}
        </View>
      )}
      {renderScrollToBottomButton && (
        <View
          pointerEvents={scrollLeaveBottom ? 'auto' : 'none'}
          style={[styles.scrollButton, safeAreaLayout]}>
          {renderScrollToBottomButton({
            visible: scrollLeaveBottom,
            onPress: () => scrollRef.current?.scrollToBottom(false),
          })}
        </View>
      )}
    </View>
  )
}

type HandleableMessage = SendbirdUserMessage | SendbirdFileMessage
type UseGetMessagePressActionsProps = Pick<
  GroupChannelProps['MessageList'],
  | 'channel'
  | 'currentUserId'
  | 'onResendFailedMessage'
  | 'onDeleteMessage'
  | 'onPressImageMessage'
  | 'onPressMediaMessage'
>
const useGetMessagePressActions = ({
  channel,
  currentUserId,
  onResendFailedMessage,
  onDeleteMessage,
  onPressImageMessage,
  onPressMediaMessage,
}: UseGetMessagePressActionsProps): ((msg: SendbirdMessage) => {
  onPress?: (() => void) | undefined
  onLongPress?: (() => void) | undefined
}) => {
  const { colors } = useUIKitTheme()
  const { STRINGS } = useLocalization()
  const toast = useToast()
  const { openSheet } = useBottomSheet()
  const { alert } = useAlert()
  const { clipboardService, fileService } = usePlatformService()
  const { features } = useSendbirdChat()
  const { setMessageToEdit } = useContext(GroupChannelContexts.Fragment)

  const handleFailedMessage = (message: HandleableMessage): void => {
    openSheet({
      sheetItems: [
        {
          title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_FAILED_RETRY,
          onPress: (): Promise<void> =>
            onResendFailedMessage(message).catch((): void =>
              toast.show(STRINGS.TOAST.RESEND_MSG_ERROR, 'error')
            ),
        },
        {
          title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_FAILED_REMOVE,
          titleColor: colors.ui.dialog.default.none.destructive,
          onPress: (): void => confirmDelete(message),
        },
      ],
    })
  }
  const confirmDelete = (message: HandleableMessage): void => {
    alert({
      title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_DELETE_CONFIRM_TITLE,
      buttons: [
        {
          text: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_DELETE_CONFIRM_CANCEL,
        },
        {
          text: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_DELETE_CONFIRM_OK,
          style: 'destructive',
          onPress: () =>
            onDeleteMessage(message).catch(() =>
              toast.show(STRINGS.TOAST.DELETE_MSG_ERROR, 'error')
            ),
        },
      ],
    })
  }

  return (
    msg: SendbirdMessage
  ): {
    onPress?: (() => void) | undefined
    onLongPress?: (() => void) | undefined
  } => {
    if (!msg.isUserMessage() && !msg.isFileMessage()) {
      return { onPress: undefined, onLongPress: undefined }
    }

    const sheetItems: BottomSheetItem['sheetItems'] = []
    const response: { onPress?: () => void; onLongPress?: () => void } = {
      onPress: undefined,
      onLongPress: undefined,
    }

    if (msg.isUserMessage()) {
      sheetItems.push({
        icon: 'copy',
        title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_COPY,
        onPress: () => {
          clipboardService.setString(msg.message || '')
          toast.show(STRINGS.TOAST.COPY_OK, 'success')
        },
      })

      if (
        isMyMessage(msg, currentUserId) &&
        msg.sendingStatus === 'succeeded'
      ) {
        sheetItems.push(
          {
            icon: 'edit',
            title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_EDIT,
            onPress: () => setMessageToEdit(msg),
          },
          {
            icon: 'delete',
            title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_DELETE,
            onPress: () => confirmDelete(msg),
          }
        )
      }
    }

    if (msg.isFileMessage()) {
      sheetItems.push({
        icon: 'download',
        title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_SAVE,
        onPress: async () => {
          if (toMegabyte(msg.size) > 4) {
            toast.show(STRINGS.TOAST.DOWNLOAD_START, 'success')
          }

          fileService
            .save({ fileUrl: msg.url, fileName: msg.name, fileType: msg.type })
            .then(_response => {
              toast.show(STRINGS.TOAST.DOWNLOAD_OK, 'success')
              Logger.log('File saved to', _response)
            })
            .catch(err => {
              toast.show(STRINGS.TOAST.DOWNLOAD_ERROR, 'error')
              Logger.log('File save failure', err)
            })
        },
      })

      if (
        isMyMessage(msg, currentUserId) &&
        msg.sendingStatus === 'succeeded'
      ) {
        sheetItems.push({
          icon: 'delete',
          title: STRINGS.GROUP_CHANNEL.DIALOG_MESSAGE_DELETE,
          onPress: () => confirmDelete(msg),
        })
      }

      const fileType = getFileType(msg.type || getFileExtension(msg.name))
      switch (fileType) {
        case 'image':
        case 'video':
        case 'audio': {
          response.onPress = (): void => {
            if (onPressImageMessage && fileType === 'image') {
              Logger.warn(
                DEPRECATION_WARNING.GROUP_CHANNEL.ON_PRESS_IMAGE_MESSAGE
              )
              onPressImageMessage(msg, getAvailableUriFromFileMessage(msg))
            }
            onPressMediaMessage?.(
              msg,
              () => onDeleteMessage(msg),
              getAvailableUriFromFileMessage(msg)
            )
          }
          break
        }
        default: {
          response.onPress = (): void => SBUUtils.openURL(msg.url)
          break
        }
      }
    }

    if (sheetItems.length > 0) {
      response.onLongPress = (): void => {
        openSheet({
          sheetItems,
          HeaderComponent: shouldRenderReaction(
            channel,
            features.reactionEnabled
          )
            ? ({ onClose }): ReactElement => (
                <ReactionAddons.BottomSheet
                  message={msg}
                  channel={channel}
                  onClose={onClose}
                />
              )
            : undefined,
        })
      }
    }

    if (msg.sendingStatus === 'failed') {
      response.onLongPress = (): void => handleFailedMessage(msg)
      response.onPress = (): void => {
        onResendFailedMessage(msg).catch(() =>
          toast.show(STRINGS.TOAST.RESEND_MSG_ERROR, 'error')
        )
      }
    }

    if (msg.sendingStatus === 'pending') {
      response.onLongPress = undefined
      response.onPress = undefined
    }

    return response
  }
}

const styles = createStyleSheet({
  frozenBanner: {
    position: 'absolute',
    zIndex: 999,
    top: 8,
    left: 8,
    right: 8,
  },
  frozenListPadding: {
    paddingBottom: 32,
  },
  newMsgButton: {
    position: 'absolute',
    zIndex: 999,
    bottom: 10,
    alignSelf: 'center',
  },
  scrollButton: {
    position: 'absolute',
    zIndex: 998,
    bottom: 10,
    right: 16,
  },
})

export default React.memo(GroupChannelMessageList)
