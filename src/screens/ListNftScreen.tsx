import React, { ReactElement } from 'react'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@sendbird/uikit-react-native-foundation'
import { useRecoilValue } from 'recoil'
import { SignedNftOrderV4Serialized } from '@traderxyz/nft-swap-sdk'
import firestore from '@react-native-firebase/firestore'
import { useGroupChannel } from '@sendbird/uikit-chat-hooks'
import { useSendbirdChat } from '@sendbird/uikit-react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { COLOR, UTIL } from 'consts'
import { Moralis, QueryKeyEnum, Token } from 'types'
import {
  Header,
  SubmitButton,
  FormInput,
  Container,
  Row,
  NftRenderer,
  EthLogoWrapper,
  KeyboardAvoidingView,
} from 'components'
import useZxListNft from 'hooks/zx/useZxListNft'
import { Routes } from 'libs/navigation'
import { useAppNavigation } from 'hooks/useAppNavigation'
import selectNftStore from 'store/selectNftStore'
import { nftUriFetcher } from 'libs/nft'
import { stringifySendFileData } from 'libs/sendbird'
import useFsChannel from 'hooks/firestore/useFsChannel'
import useNft from 'hooks/contract/useNft'
import useReactQuery from 'hooks/complex/useReactQuery'

const Contents = ({
  channelUrl,
  selectedNft,
}: {
  channelUrl: string
  selectedNft: Moralis.NftItem
}): ReactElement => {
  const nftContract = selectedNft.token_address
  const { price, setPrice, isApproved, onClickApprove, onClickConfirm } =
    useZxListNft({
      nftContract,
      tokenId: selectedNft.token_id,
    })
  const { sdk } = useSendbirdChat()
  const { channel } = useGroupChannel(sdk, channelUrl)

  const { fsChannel } = useFsChannel({ channelUrl })

  const { name } = useNft({ nftContract })

  const { data: tokenName = '' } = useReactQuery(
    [QueryKeyEnum.NFT_TOKEN_NAME, nftContract],
    name
  )

  const onSubmit = async (
    token_uri: string,
    order: SignedNftOrderV4Serialized | undefined
  ): Promise<void> => {
    if (!channel || !order || !fsChannel) {
      return
    }
    const imgInfo = await nftUriFetcher(token_uri)
    imgInfo.data = stringifySendFileData({
      type: 'list',
      selectedNft,
      nonce: order.nonce,
      ethAmount: UTIL.microfyP(price),
    })
    channel.sendFileMessage(imgInfo)

    try {
      // add the new listing item to the corresponding channel doc firestore
      await fsChannel
        .collection('listings')
        .doc(order.nonce)
        .set({ order, status: 'active' })

      // also add to listings collection for keeping track of listed channels for the nft
      await firestore()
        .collection('listings')
        .doc(selectedNft.token_address)
        .collection('orders')
        .doc(order.nonce)
        .set({ order, channelUrl, status: 'active' })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <View style={styles.body}>
        <View style={{ paddingHorizontal: 20 }}>
          <Row style={{ paddingBottom: 10 }}>
            <View style={{ width: 100, height: 100, marginEnd: 10 }}>
              <EthLogoWrapper>
                <NftRenderer
                  nftContract={selectedNft.token_address}
                  tokenId={selectedNft.token_id}
                />
              </EthLogoWrapper>
            </View>
            <View style={{ rowGap: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {tokenName}
              </Text>
              <Text>#{selectedNft.token_id}</Text>
            </View>
          </Row>
          <Row style={styles.traitsBox}>
            <View style={styles.traits}>
              <Text>Background</Text>
              <Text style={{ color: COLOR.primary._400 }}>Blue</Text>
            </View>
            <View style={styles.traits}>
              <Text>Face</Text>
              <Text style={{ color: COLOR.primary._400 }}>Default</Text>
            </View>
            <View style={styles.traits}>
              <Text>Hair</Text>
              <Text style={{ color: COLOR.primary._400 }}>Yellow Star</Text>
            </View>
            <View style={styles.traits}>
              <Text>Hair</Text>
              <Text style={{ color: COLOR.primary._400 }}>Yellow Star</Text>
            </View>
          </Row>
        </View>
        <View>
          {isApproved ? (
            <View>
              <View style={styles.priceBox}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: 'white' }}>Current Floor Price</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    2.5 ETH
                  </Text>
                </Row>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: 'white' }}>Gas Fee</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    0.01 ETH
                  </Text>
                </Row>
                <View style={{ position: 'relative' }}>
                  <FormInput
                    placeholder="Price"
                    maxLength={10}
                    value={price}
                    onChangeText={(value): void => {
                      setPrice(value as Token)
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      position: 'absolute',
                      right: 20,
                      top: 15,
                    }}>
                    ETH
                  </Text>
                </View>
              </View>
              <View
                style={{ paddingHorizontal: 25, gap: 5, paddingVertical: 10 }}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Ionicon name="checkmark-circle-outline" size={14} />
                  <Text style={{ fontSize: 14, paddingRight: 15 }}>
                    The sale will be accepted and concluded unless you cancel
                    it.
                  </Text>
                </Row>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Ionicon name="checkmark-circle-outline" size={14} />
                  <Text style={{ fontSize: 14 }}>
                    The sale listing is valid for 24 hours.
                  </Text>
                </Row>
              </View>
              <SubmitButton
                containerStyle={{ borderRadius: 0 }}
                disabled={!price}
                onPress={async (): Promise<void> => {
                  Keyboard.dismiss()
                  const order = await onClickConfirm()
                  onSubmit(selectedNft.token_uri, order)
                }}>
                List up to sell
              </SubmitButton>
            </View>
          ) : (
            <View>
              <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                  Approve to list your NFT
                </Text>
              </View>
              <SubmitButton
                containerStyle={{ borderRadius: 0 }}
                onPress={(): void => {
                  Keyboard.dismiss()
                  onClickApprove()
                }}>
                Approve
              </SubmitButton>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const ListNftScreen = (): ReactElement => {
  const { params, navigation } = useAppNavigation<Routes.ListNft>()

  const selectedNftList = useRecoilValue(selectNftStore.selectedNftList)

  return (
    <Container style={{ flex: 1 }}>
      <Header
        title="List NFT"
        left={<Icon icon={'close'} />}
        onPressLeft={navigation.goBack}
      />
      {selectedNftList.length > 0 && (
        <Contents
          channelUrl={params.channelUrl}
          selectedNft={selectedNftList[0]}
        />
      )}
    </Container>
  )
}

export default ListNftScreen

const styles = StyleSheet.create({
  body: {
    paddingTop: 20,
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  priceBox: {
    backgroundColor: COLOR.primary._400,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    rowGap: 10,
    marginHorizontal: 20,
  },
  traitsBox: {
    columnGap: 10,
  },
  traits: {
    rowGap: 5,
    alignItems: 'center',
    backgroundColor: COLOR.primary._100,
    borderRadius: 15,
    padding: 20,
  },
})
