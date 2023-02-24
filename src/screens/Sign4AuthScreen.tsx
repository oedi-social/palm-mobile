import React, { ReactElement } from 'react'
import { StyleSheet, View, Text } from 'react-native'

import { Container, FormButton } from 'components'
import useSign4Auth from 'hooks/page/sign/useSign4Auth'
import { useRecoilValue } from 'recoil'
import fetchApiStore from 'store/fetchApiStore'
import useAuth from 'hooks/independent/useAuth'

const Sign4AuthScreen = (): ReactElement => {
  const { logout } = useAuth()
  const { signMessage, onPress } = useSign4Auth()
  const isFetching = useRecoilValue(fetchApiStore.isFetchingPostApiStore)

  return (
    <Container style={styles.container}>
      <View>
        <View style={{ paddingBottom: 20 }}>
          <Text style={{ fontSize: 20 }}>Sign</Text>
        </View>
        <View style={styles.signMessageBox}>
          <Text>{signMessage || 'Loading message.'}</Text>
        </View>
      </View>
      <View style={{ rowGap: 10 }}>
        <FormButton disabled={!signMessage || isFetching} onPress={onPress}>
          Sign to Login
        </FormButton>
        <FormButton figure="error" onPress={logout}>
          Cancel
        </FormButton>
      </View>
    </Container>
  )
}

export default Sign4AuthScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  signMessageBox: {
    padding: 10,
    backgroundColor: '#cecece',
    borderRadius: 20,
  },
})
