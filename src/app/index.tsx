import { ImageCard } from '@/components/ImageCard';
import { LinkCard } from '@/components/LinkCard';
import { NoteCard } from '@/components/NoteCard';
import { QuoteCard } from '@/components/QuoteCard';
import { RedditCard } from '@/components/RedditCard';
import { TweetCard } from '@/components/TweetCard';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start gap-4">
          {/* Left Column */}
          <View className="flex-1 gap-4">
            <NoteCard
              text="Lorem ipsum dolor sit amet consectetur. Nisl interdum in dictumst quis id eu tincidunt. Aliquet dui lacus risus vel quis at morbi. Eget sed arcu a nulla purus. Erat elementum diam tempus lacus pharetra."
              title="Sample Note"
            />

            <ImageCard
              url="https://i.pinimg.com/736x/83/04/81/830481a78d2d7823a9cd9a162e3134aa.jpg"
              title="Sample Image"
            />

            <RedditCard
              subredditAvatar="https://styles.redditmedia.com/t5_38nds/styles/communityIcon_gisj6ovi5z6e1.png?width=96&height=96&frame=1&auto=webp&s=0d0d70a2dccf65fa9374160882dc3ab2496890b1"
              subredditName="r/FilosofiaBR"
              postTitle="Existe algo muito interessante na ideia de Spinoza, o maior erro que cometemos ao pensar em Deus seja imaginar que ele precisa estar fora de tudo"
              text="Spinoza propõe uma ideia muito mais difícil de imaginar, Deus e natureza não seriam duas coisas diferentes. Deus seria a própria existência. Não estaria apenas criando o mundo, mas se manifestando através dele. Tudo aquilo que existe faria parte desse mesmo todo. Isso muda completamente a maneira de olhar para nós mesmos. Porque, se somos parte da natureza, então não estamos simplesmente vivendo dentro de um universo que existe separado de nós. Nós somos uma expressão dele"
              image="https://cf.preview.redd.it/existe-algo-muito-interessante-na-ideia-de-spinoza-o-maior-v0-th3lbt1r12th1.jpeg?auto=webp&s=cd1a58f867d75ab541e6245da99f535a0eea65c1"
            />
          </View>

          {/* Right Column */}
          <View className="flex-1 gap-4">
            <QuoteCard text="Alguns vivem como se nunca fossem viver, outros morrem como se nunca tivessem vivido. Eu não vivo em vão, eu vivo pra ser feliz, eu não vivo pra ser normal. Sou Charlie Brown, mané!" />
            <TweetCard
              avatar="https://pbs.twimg.com/profile_images/2096296808729186306/YPFTW33c_400x400.jpg"
              author="nostalgia & history"
              text="tobacco company ceo’s declaring, under oath, that nicotine isn't addictive (1994)"
              images={['https://pbs.twimg.com/media/HTot854XIAAUCVF?format=jpg&name=small']}
            />
            <LinkCard
              favicon="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAgVBMVEX99/H9+/X9//n+t7D+p5//ZVr/dGr/gHb+u7T/eW//bWL/RDb/YFX+rKT/hHv+yMH/U0b/KRP/npb+zsf95d/+2NH/lo3/Sz398ev+1s//i4L+sqv/GAD/OCf/WE3/AAD+wLn/nJT+o5v97ef94dv/XFD+z8j9//r+qqL/kIf/cGXuJnjqAAABiElEQVR4AWKgCgDURV8JsENQAEBdkSITZARRpiBS97+/13v5ddwOgDGG/1hF6qbt8L8M0/42AOPVPxTEKO5STGrU8HegmYl1hnnp/w6F8Oj4bB7Nff47EtnbTddqnJ+vfyBMhlis72/2D0S2nyNA+s8sjOhKZQV/AVosVrcIWJY/EEA2A18/v6u0we+m+wSxaIIRxIXvvxW1FFuLsR40AsCOSgs/onFaCmDmjuJzYnpHfevzN4VyJrZH5oSJLG4ihKSCoACfw3caqdqqneVCVypTiOLU9oz6kGhhYw6mJoZukrcm69dpLoXZ6AFQq1nkG+1dk6fDp069WulvRa5j45BNW2RFNFzsn+8V7TVTRmeWae4RiWInXTXEfZqOMwXNWz9oKRDqCNrSjqNIK0amUyI4zpJsO7JjlwkKCoWuf5KdlbBM25TMJht2guDHgYwNdnm+8kJONzmRgZez1VcJzAWkNVqOntJKBkuhCjZUlT8Gn0PACIppTn6jfJIq4ur0Vx0vUlPSbeUjpuEjyNkvA9UAAAAASUVORK5CYII="
              siteTitle="Arts & Letters Daily"
              description="Philosophy, literature, ideas, criticism, history, art, music from The Chronicle of Higher Education."
              url="aldaily.com"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
