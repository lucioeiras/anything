import { SmileyIcon, StarIcon } from 'phosphor-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

type CardReviewProps = {
  rating: number | null;
  comments: string;
  onRatingChange: (rating: number) => void;
  onCommentsChange: (comments: string) => void;
};

export function CardReview({
  rating: reviewRating,
  comments: reviewComments,
  onRatingChange: setReviewRating,
  onCommentsChange: setReviewComments,
}: CardReviewProps) {
  return (
    <View className="py-6 px-6 border-b border-zinc-800 gap-4">
      <View className="w-full flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <SmileyIcon size={16} color="#D4D4D8" />
          <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
            My review
          </Text>
        </View>

        {/* Estrelas */}
        <View className="flex-row items-center">
          {Array.from({ length: 5 }, (_, index) => {
            const halfRating = index + 0.5;
            const fullRating = index + 1;
            const fillWidth =
              reviewRating !== null && reviewRating >= fullRating
                ? 20
                : reviewRating !== null && reviewRating >= halfRating
                  ? 10
                  : 0;

            return (
              <View key={index} className="h-6 w-8 items-center justify-center">
                <StarIcon size={20} color="#52525B" weight="light" />
                {fillWidth > 0 && (
                  <View
                    className="absolute overflow-hidden"
                    style={{ left: 4.5, top: 1.5, width: fillWidth, height: 20 }}
                  >
                    <StarIcon size={20} color="#FFFFFF" weight="fill" />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${halfRating} out of 5 stars`}
                  accessibilityState={{ selected: reviewRating === halfRating }}
                  onPress={() => setReviewRating(halfRating)}
                  className="absolute left-0 top-0 h-6 w-1/2"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${fullRating} out of 5 stars`}
                  accessibilityState={{ selected: reviewRating === fullRating }}
                  onPress={() => setReviewRating(fullRating)}
                  className="absolute right-0 top-0 h-6 w-1/2"
                />
              </View>
            );
          })}
        </View>
      </View>

      <TextInput
        value={reviewComments}
        onChangeText={setReviewComments}
        multiline
        placeholder="What is your opinion on this?"
        placeholderTextColor="#71717A"
        textAlignVertical="top"
        className="min-h-24 font-sans text-base text-white"
        style={{ padding: 0, backgroundColor: 'transparent' }}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}
