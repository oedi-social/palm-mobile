import React, { ReactElement } from 'react'
import styled from 'styled-components/native'
import { useRecoilValue } from 'recoil'
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Icon } from '@sendbird/uikit-react-native-foundation'

import { COLOR, UTIL } from 'consts'
import images from 'assets/images'

import postTxStore from 'store/postTxStore'
import { PostTxStatus } from 'types'

import { FormImage, Card, LinkExplorer } from 'components'

const StyledTextBox = styled(View)`
  align-items: center;
  margin-bottom: 10px;
`

const StatusText = ({ children }: { children: string }): ReactElement => {
  return <Text>{children}</Text>
}

const TxStatusMini = ({
  onPressClose,
  setMinimized,
}: {
  onPressClose: () => void
  setMinimized: React.Dispatch<React.SetStateAction<boolean>>
}): ReactElement => {
  const postTxResult = useRecoilValue(postTxStore.postTxResult)
  return (
    <Pressable
      style={styles.container}
      onPress={(): void => {
        setMinimized(false)
      }}>
      {[PostTxStatus.POST, PostTxStatus.BROADCAST].includes(
        postTxResult.status
      ) === false && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={(e): void => {
            onPressClose()
            e.stopPropagation()
          }}>
          <Icon icon="close" size={20} />
        </TouchableOpacity>
      )}
      <Card style={styles.card}>
        {postTxResult.status === PostTxStatus.POST && (
          <>
            <View style={styles.iconBox}>
              <FormImage source={images.loading} size={30} />
            </View>
            <StyledTextBox>
              <StatusText>Posting...</StatusText>
            </StyledTextBox>
          </>
        )}

        {postTxResult.status === PostTxStatus.BROADCAST && (
          <>
            <View style={styles.iconBox}>
              <FormImage source={images.loading} size={30} />
            </View>
            <StyledTextBox>
              <StatusText>Pending TX...</StatusText>
              <LinkExplorer type="tx" address={postTxResult.transactionHash}>
                <Text style={{ color: COLOR.primary._400 }}>
                  {UTIL.truncate(postTxResult.transactionHash, [4, 4])}
                </Text>
              </LinkExplorer>
            </StyledTextBox>
          </>
        )}

        {postTxResult.status === PostTxStatus.DONE && (
          <>
            <View style={styles.iconBox}>
              <Icon icon="done" size={30} color="green" />
            </View>
            {postTxResult.value ? (
              <StyledTextBox>
                <LinkExplorer
                  type="tx"
                  address={postTxResult.value.transactionHash}>
                  <Text style={{ color: COLOR.primary._400 }}>
                    {UTIL.truncate(postTxResult.value.transactionHash, [4, 4])}
                  </Text>
                </LinkExplorer>
              </StyledTextBox>
            ) : (
              <Text>Done</Text>
            )}
          </>
        )}

        {postTxResult.status === PostTxStatus.ERROR && (
          <>
            <View style={styles.iconBox}>
              <Icon icon="error" size={30} color="red" />
            </View>
            <StyledTextBox>
              <StatusText>Tx failed</StatusText>
            </StyledTextBox>
          </>
        )}
      </Card>
    </Pressable>
  )
}

export default TxStatusMini

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 0,
    zIndex: 1,
    cursor: 'zoom-in',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    padding: 10,
    zIndex: 1,
  },
  card: {
    minWidth: 100,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
    paddingBottom: 10,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: COLOR.primary._100,
    borderWidth: 2,
    borderColor: COLOR.primary._300,
    borderRightWidth: 0,
  },
  iconBox: {
    alignItems: 'center',
  },
})
