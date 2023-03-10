import React, { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useAppNavigation } from 'hooks/useAppNavigation'
import { Routes } from 'libs/navigation'
import Icon from 'react-native-vector-icons/Ionicons'

import { COLOR } from 'consts'

import { SbShareNftDataType } from 'types'

import useNftImage from 'hooks/independent/useNftImage'
import FormButton from '../../atoms/FormButton'
import MediaRenderer from '../../atoms/MediaRenderer'
import Row from '../../atoms/Row'
import EthLogoWrapper from '../../molecules/EthLogoWrapper'

const ShareNftMessage = ({
  data,
}: {
  data: SbShareNftDataType
}): ReactElement => {
  const { navigation } = useAppNavigation()

  const item = data.selectedNft
  const { uri } = useNftImage({
    nftContract: item.token_address,
    tokenId: item.token_id,
    metadata: item.metadata,
  })

  return (
    <View style={styles.container}>
      <EthLogoWrapper>
        <MediaRenderer
          src={uri}
          width={'100%'}
          height={150}
          style={{ borderRadius: 10 }}
        />
      </EthLogoWrapper>
      <View style={styles.body}>
        <Row style={{ alignItems: 'center', columnGap: 5 }}>
          <Icon
            name="ios-shield-checkmark"
            color={COLOR.primary._400}
            size={20}
          />
          <Text
            style={{ color: 'black' }}>{`${item.name} #${item.token_id}`}</Text>
        </Row>

        <FormButton
          size="sm"
          onPress={(): void => {
            navigation.navigate(Routes.NftDetail, {
              nftContract: item.token_address,
              tokenId: item.token_id,
            })
          }}>
          Details
        </FormButton>
      </View>
    </View>
  )
}

export default ShareNftMessage

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    width: 240,
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  body: { paddingTop: 10, gap: 10 },
  priceBox: {
    backgroundColor: COLOR.primary._50,
    padding: 10,
    rowGap: 5,
    borderRadius: 10,
  },
  priceRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
