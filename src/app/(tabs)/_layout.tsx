import { Tabs } from 'expo-router';
import { FolderIcon, NutIcon, SquaresFourIcon } from 'phosphor-react-native';

import { ProgressiveBlur } from '@/components/effects/ProgressiveBlur';
import { SearchBarOverlayProvider } from '@/components/menus/SearchBarOverlay';

const iconSize = 28;

export default function TabLayout() {
  return (
    <SearchBarOverlayProvider>
      <Tabs
        initialRouteName="board"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFFFFF', // tailwind blue-500
          tabBarInactiveTintColor: '#9F9FA9', // tailwind zinc-500
          tabBarBackground: () => <ProgressiveBlur height={160} darkLayerOpacity={0.9} />,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            paddingTop: 8,
            paddingHorizontal: 24,
          },
          tabBarLabelStyle: {
            fontFamily: 'InstrumentSans_700Bold',
            fontSize: 10,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="board"
          options={{
            title: 'Board',
            tabBarIcon: ({ color, focused }) => (
              <SquaresFourIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="folders"
          options={{
            title: 'Folders',
            tabBarIcon: ({ color, focused }) => (
              <FolderIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen name="add" options={{ href: null }} />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <NutIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
      </Tabs>
    </SearchBarOverlayProvider>
  );
}
