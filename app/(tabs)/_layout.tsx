import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '@/context/AppContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { theme, isDarkMode } = useAppContext();
  const insets = useSafeAreaInsets();

  // Calculate safe bottom padding for Android gesture navigation
  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 10) + 5
    : insets.bottom + 5;

  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E293B' : '#ffffff',
          borderTopColor: theme.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'android' ? 4 : 0,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Maçlar',
          headerTitle: 'Planlanan Maçlar',
          tabBarIcon: ({ color }) => <TabBarIcon name="soccer-field" color={color} />,
        }}
      />
      <Tabs.Screen
        name="canli"
        options={{
          title: 'Canlı Takip',
          headerTitle: 'Canlı Maç',
          tabBarIcon: ({ color }) => <TabBarIcon name="broadcast" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sonuclar"
        options={{
          title: 'Sonuçlar',
          headerTitle: 'Maç Sonuçları',
          tabBarIcon: ({ color }) => <TabBarIcon name="trophy-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ayarlar"
        options={{
          title: 'Ayarlar',
          headerTitle: 'Ayarlar',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
