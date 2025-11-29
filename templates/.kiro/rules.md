# Kiro (AWS) Instructions

## Project Context

React Native/Expo Mobile Development Project

This project uses React Native and/or Expo for cross-platform mobile development. Follow these guidelines to provide accurate and helpful assistance.

## Core Rules

- Always detect project context before suggesting code (check package.json for versions)
- Verify APIs exist for the detected React Native/Expo version before suggesting
- Use TypeScript with proper type annotations unless the project uses JavaScript
- Follow React Native performance best practices (memo, useCallback, FlatList optimization)
- Prefer functional components with hooks over class components
- Handle platform differences when necessary using Platform.OS or platform-specific files

## API Validation

- Check React Native version before using new APIs (e.g., useWindowDimensions requires RN 0.61+)
- Check Expo SDK version for Expo-specific APIs
- Verify third-party library versions (React Navigation, Reanimated, Gesture Handler, etc.)
- Use optional chaining and nullish coalescing for safer code
- Import from correct packages (react-native vs expo-* vs @react-navigation/*)

## Best Practices

- Use FlatList/SectionList for long lists, never ScrollView with many items
- Implement proper loading states and error handling
- Use React.memo() for pure components that render often
- Avoid inline functions in render for frequently re-rendering components
- Use StyleSheet.create() instead of inline styles for performance
- Handle keyboard avoiding behavior for forms
- Test on both iOS and Android platforms
- Use proper accessibility labels and hints

## Navigation

- Use React Navigation for routing (@react-navigation/native)
- Properly type navigation props with TypeScript
- Use navigation.navigate() with proper screen names
- Handle deep linking when required
- Configure proper header options for screens

## State Management

- Use React Context for simple state sharing
- Consider Zustand, Jotai, or Redux Toolkit for complex state
- Use React Query or SWR for server state
- Persist state with MMKV or AsyncStorage as appropriate
- Avoid prop drilling more than 2-3 levels deep

## Code Examples

### Optimized FlatList

```typescript
// Optimized FlatList with proper performance settings
import React, { memo, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';

interface Item {
  id: string;
  title: string;
}

interface ItemProps {
  item: Item;
}

const ListItem = memo(({ item }: ItemProps) => (
  <View style={styles.item}>
    <Text>{item.title}</Text>
  </View>
));

export function OptimizedList({ data }: { data: Item[] }) {
  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ListItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      getItemLayout={(_, index) => ({
        length: 50,
        offset: 50 * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  item: { height: 50, padding: 10 },
});
```

### Navigation Setup

```typescript
// Type-safe React Navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the param list for type safety
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: string };
  Profile: { userId: string };
};

// Export typed navigation props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Error Boundary

```typescript
// Error Boundary for React Native
import React, { Component, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <Button title="Try Again" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  message: { color: '#666', marginBottom: 20, textAlign: 'center' },
});
```