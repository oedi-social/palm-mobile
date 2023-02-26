import React, { ReactElement } from 'react'
import { View, Linking, StyleSheet } from 'react-native'

import Icons from 'components/atoms/Icons'
import styled from 'styled-components/native'

import { MediaRendererProps } from './MediaRenderer'

const StyledText = styled.Text`
  color: 'rgb(138, 147, 155)';
`

const FallbackMediaRenderer = ({
  src,
  alt,
  width,
  height,
  style,
}: MediaRendererProps): ReactElement => {
  return (
    <View style={[{ ...styles.container, width, height }, style]}>
      <Icons.CarbonDocumentUnknown
        width={50}
        height={50}
        style={{ marginBottom: 10 }}
      />
      <StyledText
        numberOfLines={1}
        onPress={async (): Promise<void> => {
          const canOpen = !!src && (await Linking.canOpenURL(src))
          if (canOpen) {
            Linking.openURL(src)
          }
        }}>
        {alt || 'File'}
      </StyledText>
    </View>
  )
}

export default FallbackMediaRenderer

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})