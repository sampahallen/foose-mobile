import { Image } from 'expo-image'
import { useState } from 'react'
import { Dimensions, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

/** Paged image carousel with a dot counter, matching the web listing gallery. */
export function ListingImageSlider({ images, title }: { images: string[]; title: string }) {
  const width = Dimensions.get('window').width
  const [index, setIndex] = useState(0)

  if (!images.length) {
    return (
      <View className="items-center justify-center bg-foose-surface-mid" style={{ height: width, width }}>
        <Text className="text-sm font-semibold text-foose-faint">Image unavailable</Text>
      </View>
    )
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
  }

  return (
    <View>
      <ScrollView horizontal onMomentumScrollEnd={onScroll} pagingEnabled showsHorizontalScrollIndicator={false}>
        {images.map((image) => (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={title}
            contentFit="cover"
            key={image}
            source={{ uri: image }}
            style={{ height: width, width }}
            transition={150}
          />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View className="absolute bottom-3 self-center flex-row gap-1.5">
          {images.map((image, dotIndex) => (
            <View
              className={`size-1.5 rounded-full ${dotIndex === index ? 'bg-white' : 'bg-white/50'}`}
              key={image}
            />
          ))}
        </View>
      )}
    </View>
  )
}
