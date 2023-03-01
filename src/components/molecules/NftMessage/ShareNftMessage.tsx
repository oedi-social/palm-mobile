import React, { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import FormButton from 'components/atoms/FormButton'
import { useAppNavigation } from 'hooks/useAppNavigation'
import { Routes } from 'libs/navigation'
import Icon from 'react-native-vector-icons/Ionicons'

import { COLOR } from 'consts'

import { QueryKeyEnum, SbShareNftDataType } from 'types'
import { fetchNftImage } from 'libs/fetchTokenUri'
import useReactQuery from 'hooks/complex/useReactQuery'

import MediaRenderer from '../../atoms/MediaRenderer'
import Row from '../../atoms/Row'

const ShareNftMessage = ({
  data,
}: {
  data: SbShareNftDataType
}): ReactElement => {
  const { navigation } = useAppNavigation()

  const item = data.selectedNft
  const { data: uri } = useReactQuery(
    [QueryKeyEnum.MORALIS_NFT_IMAGE, item.token_address, item.token_id],
    () => fetchNftImage({ metadata: item.metadata, tokenUri: item.token_uri })
  )

  return (
    <View style={styles.container}>
      <MediaRenderer src={uri} width={'100%'} height={150} />
      <View style={styles.body}>
        <Row style={{ alignItems: 'center', columnGap: 5 }}>
          <Icon
            name="ios-shield-checkmark"
            color={COLOR.primary._400}
            size={20}
          />
          <Text
            numberOfLines={2}
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
  container: { backgroundColor: 'white', width: 240 },
  body: { padding: 10, gap: 10 },
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
