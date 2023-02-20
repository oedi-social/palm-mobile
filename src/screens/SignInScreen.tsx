import React, { ReactElement, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { SessionHandler } from '@sendbird/chat'
import { useConnection, useSendbirdChat } from '@sendbird/uikit-react-native'
import {
  Button,
  Text,
  TextInput,
  useUIKitTheme,
} from '@sendbird/uikit-react-native-foundation'

import { SendbirdAPI } from 'libs/sendbird'
import { useAppAuth } from 'libs/authentication'

const SignInScreen = (): ReactElement => {
  const [userId, setUserId] = useState('')
  const [nickname, setNickname] = useState('')

  const { sdk } = useSendbirdChat()
  const { connect } = useConnection()

  const connectWith = async (
    _userId: string,
    _nickname?: string,
    useSessionToken = false
  ): Promise<void> => {
    if (useSessionToken) {
      const sessionHandler = new SessionHandler()
      sessionHandler.onSessionTokenRequired = (onSuccess, onFail): void => {
        SendbirdAPI.getSessionToken(_userId)
          .then(({ token }) => onSuccess(token))
          .catch(onFail)
      }
      sdk.setSessionHandler(sessionHandler)

      const data = await SendbirdAPI.getSessionToken(_userId)
      await connect(_userId, {
        nickname: _nickname,
        accessToken: data.token,
      })
    } else {
      await connect(_userId, {
        nickname: _nickname,
      })
    }
  }

  const { loading, signIn } = useAppAuth(user =>
    connectWith(user.userId, user.nickname)
  )
  const { colors } = useUIKitTheme()

  if (loading) {
    return <></>
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        style={styles.logo}
        source={require('../assets/logoSendbird.png')}
      />
      <Text style={styles.title}>{'Set Profile'}</Text>
      <TextInput
        placeholder={'User ID'}
        value={userId}
        onChangeText={setUserId}
        style={[
          styles.input,
          { backgroundColor: colors.onBackground04, marginBottom: 12 },
        ]}
      />
      <TextInput
        placeholder={'Nickname'}
        value={nickname}
        onChangeText={setNickname}
        style={[styles.input, { backgroundColor: colors.onBackground04 }]}
      />
      <Button
        style={styles.btn}
        variant={'contained'}
        onPress={async (): Promise<void> => {
          if (userId) {
            await signIn({ userId, nickname })
            await connectWith(userId, nickname)
          }
        }}>
        {'Continue'}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 48,
    height: 48,
    marginVertical: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 34,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
  },
  input: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
})

export default SignInScreen
