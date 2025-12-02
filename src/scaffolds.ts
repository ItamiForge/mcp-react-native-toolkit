/**
 * Component Scaffold Templates Module
 * 
 * Provides boilerplate code generation for common React Native patterns.
 * Templates follow best practices and are production-ready.
 */

import type { ComponentScaffold, ScaffoldCategory, ScaffoldGenerationOptions } from './types.js';

/**
 * Collection of scaffold templates organized by ID
 */
export const SCAFFOLD_TEMPLATES: Record<string, ComponentScaffold> = {
    // ============================================
    // List Patterns
    // ============================================
    'flatlist-basic': {
        id: 'flatlist-basic',
        name: 'Basic FlatList',
        description: 'Simple FlatList with item rendering and key extraction',
        library: 'react-native',
        category: 'list',
        language: 'typescript',
        code: `import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';

{{#if types}}
interface {{itemType}} {
  id: string;
  title: string;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - A basic FlatList component
 * Renders a scrollable list of items with optimized performance
 */
{{/if}}
const {{componentName}} = () => {
  {{#if types}}const data: {{itemType}}[] = [{{/if}}{{#unless types}}const data = [{{/unless}}
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
  ];

  const renderItem = ({{#if types}}{ item }: { item: {{itemType}} }{{/if}}{{#unless types}}{ item }{{/unless}}) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
  },
});

export default {{componentName}};`,
        dependencies: ['react-native'],
        imports: ['FlatList', 'Text', 'View', 'StyleSheet'],
        notes: [
            'Use keyExtractor for optimal performance',
            'Consider FlashList for very long lists (>1000 items)',
            'Add getItemLayout if items have fixed height'
        ]
    },

    'flatlist-optimized': {
        id: 'flatlist-optimized',
        name: 'Optimized FlatList',
        description: 'Performance-optimized FlatList with getItemLayout, memoization, and pull-to-refresh',
        library: 'react-native',
        category: 'list',
        language: 'typescript',
        code: `import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View, StyleSheet, RefreshControl } from 'react-native';

const ITEM_HEIGHT = 60;

{{#if types}}
interface {{itemType}} {
  id: string;
  title: string;
  subtitle?: string;
}

interface {{componentName}}Props {
  initialData?: {{itemType}}[];
  onRefresh?: () => Promise<void>;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Performance-optimized FlatList
 * Features: getItemLayout, memoized renderItem, pull-to-refresh
 */
{{/if}}
const {{componentName}} = ({{#if types}}{ initialData = [], onRefresh }: {{componentName}}Props{{/if}}{{#unless types}}{ initialData = [], onRefresh }{{/unless}}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(initialData);

  {{#if comments}}// Memoize the getItemLayout function for consistent item heights{{/if}}
  const getItemLayout = useCallback(
    (_{{#if types}}: {{itemType}}[] | null | undefined{{/if}}, index{{#if types}}: number{{/if}}) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  {{#if comments}}// Memoize renderItem to prevent unnecessary re-renders{{/if}}
  const renderItem = useCallback(
    ({{#if types}}{ item }: { item: {{itemType}} }{{/if}}{{#unless types}}{ item }{{/unless}}) => (
      <View style={styles.item}>
        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item{{#if types}}: {{itemType}}{{/if}}) => item.id, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  {{#if comments}}// Memoize list configuration{{/if}}
  const listConfig = useMemo(
    () => ({
      initialNumToRender: 10,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      removeClippedSubviews: true,
    }),
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      {...listConfig}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    height: ITEM_HEIGHT,
    padding: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default {{componentName}};`,
        dependencies: ['react-native'],
        imports: ['FlatList', 'Text', 'View', 'StyleSheet', 'RefreshControl'],
        notes: [
            'ITEM_HEIGHT must match actual rendered height for getItemLayout to work',
            'useCallback prevents renderItem recreation on each render',
            'removeClippedSubviews improves memory usage on large lists',
            'Consider FlashList for even better performance'
        ]
    },

    'flatlist-infinite-scroll': {
        id: 'flatlist-infinite-scroll',
        name: 'Infinite Scroll FlatList',
        description: 'FlatList with pagination and infinite scroll loading',
        library: 'react-native',
        category: 'list',
        language: 'typescript',
        code: `import React, { useState, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

{{#if types}}
interface {{itemType}} {
  id: string;
  title: string;
}

interface {{componentName}}Props {
  fetchData: (page: number) => Promise<{{itemType}}[]>;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Infinite scroll FlatList with pagination
 * Automatically loads more items when reaching the end
 */
{{/if}}
const {{componentName}} = ({{#if types}}{ fetchData }: {{componentName}}Props{{/if}}{{#unless types}}{ fetchData }{{/unless}}) => {
  const [data, setData] = useState{{#if types}}<{{itemType}}[]>{{/if}}([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await fetchData(page);
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, loading, hasMore]);

  const renderItem = useCallback(
    ({{#if types}}{ item }: { item: {{itemType}} }{{/if}}{{#unless types}}{ item }{{/unless}}) => (
      <View style={styles.item}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    ),
    []
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default {{componentName}};`,
        dependencies: ['react-native'],
        imports: ['FlatList', 'Text', 'View', 'StyleSheet', 'ActivityIndicator'],
        notes: [
            'onEndReachedThreshold controls when to trigger loading (0.5 = 50% from bottom)',
            'Prevent duplicate fetches with loading state check',
            'Consider debouncing onEndReached for rapid scroll'
        ]
    },

    // ============================================
    // Navigation Patterns
    // ============================================
    'stack-navigator': {
        id: 'stack-navigator',
        name: 'Stack Navigator Setup',
        description: 'Basic stack navigator with typed navigation',
        library: 'react-navigation',
        category: 'navigation',
        language: 'typescript',
        code: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button, StyleSheet } from 'react-native';

{{#if types}}
// Define the navigation param list for type safety
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: string; title: string };
};

// Type the navigation prop
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type DetailsProps = NativeStackScreenProps<RootStackParamList, 'Details'>;
{{/if}}

const Stack = createNativeStackNavigator{{#if types}}<RootStackParamList>{{/if}}();

{{#if comments}}// Home screen component{{/if}}
const HomeScreen = ({{#if types}}{ navigation }: HomeProps{{/if}}{{#unless types}}{ navigation }{{/unless}}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() =>
          navigation.navigate('Details', {
            itemId: '42',
            title: 'Detail Item',
          })
        }
      />
    </View>
  );
};

{{#if comments}}// Details screen component{{/if}}
const DetailsScreen = ({{#if types}}{ route, navigation }: DetailsProps{{/if}}{{#unless types}}{ route, navigation }{{/unless}}) => {
  const { itemId, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text>Item ID: {itemId}</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

{{#if comments}}
/**
 * {{componentName}} - Main navigation container with stack navigator
 */
{{/if}}
const {{componentName}} = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Welcome' }}
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default {{componentName}};`,
        dependencies: ['@react-navigation/native', '@react-navigation/native-stack', 'react-native-screens', 'react-native-safe-area-context'],
        imports: ['NavigationContainer', 'createNativeStackNavigator'],
        notes: [
            'Use NativeStackNavigator for better performance than regular Stack',
            'Define RootStackParamList for type-safe navigation',
            'Never pass functions or non-serializable data as params'
        ]
    },

    'tab-navigator': {
        id: 'tab-navigator',
        name: 'Bottom Tab Navigator',
        description: 'Bottom tab navigation with icons and badges',
        library: 'react-navigation',
        category: 'navigation',
        language: 'typescript',
        code: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

{{#if types}}
type TabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};
{{/if}}

const Tab = createBottomTabNavigator{{#if types}}<TabParamList>{{/if}}();

const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Home</Text>
  </View>
);

const SearchScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Search</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Profile</Text>
  </View>
);

{{#if comments}}
/**
 * {{componentName}} - Bottom tab navigator with customizable icons
 * Replace the emoji icons with proper icon components (e.g., from @expo/vector-icons)
 */
{{/if}}
const {{componentName}} = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🔍</Text>
            ),
            tabBarBadge: 3, {{#if comments}}// Shows notification badge{{/if}}
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>👤</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default {{componentName}};`,
        dependencies: ['@react-navigation/native', '@react-navigation/bottom-tabs', 'react-native-screens', 'react-native-safe-area-context'],
        imports: ['NavigationContainer', 'createBottomTabNavigator'],
        notes: [
            'Replace emoji icons with proper icon components',
            'Consider @expo/vector-icons or react-native-vector-icons',
            'Use tabBarBadge for notification counts'
        ]
    },

    // ============================================
    // Form Patterns
    // ============================================
    'form-basic': {
        id: 'form-basic',
        name: 'Basic Form',
        description: 'Simple form with TextInput and validation',
        library: 'react-native',
        category: 'form',
        language: 'typescript',
        code: `import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

{{#if types}}
interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Basic form with validation
 * Includes email validation and minimum password length check
 */
{{/if}}
const {{componentName}} = () => {
  const [formData, setFormData] = useState{{#if types}}<FormData>{{/if}}({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState{{#if types}}<FormErrors>{{/if}}({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (){{#if types}}: boolean{{/if}} => {
    const newErrors{{#if types}}: FormErrors{{/if}} = {};

    {{#if comments}}// Email validation{{/if}}
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\\S+@\\S+\\.\\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    {{#if comments}}// Password validation{{/if}}
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      {{#if comments}}// Replace with your API call{{/if}}
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Form submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          placeholder="Enter your password"
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {{componentName}};`,
        dependencies: ['react-native'],
        imports: ['TextInput', 'TouchableOpacity', 'KeyboardAvoidingView'],
        notes: [
            'Use KeyboardAvoidingView to prevent keyboard overlap',
            'Consider react-hook-form for complex forms',
            'Add proper accessibility labels for screen readers'
        ]
    },

    // ============================================
    // API Patterns
    // ============================================
    'api-fetch': {
        id: 'api-fetch',
        name: 'Fetch API Hook',
        description: 'Custom hook for data fetching with loading and error states',
        library: 'react-native',
        category: 'api',
        language: 'typescript',
        code: `import { useState, useEffect, useCallback } from 'react';

{{#if types}}
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
}
{{/if}}

{{#if comments}}
/**
 * {{hookName}} - Custom hook for data fetching
 * Handles loading states, errors, and provides refetch capability
 */
{{/if}}
function {{hookName}}{{#if types}}<T>{{/if}}(
  url{{#if types}}: string{{/if}},
  options{{#if types}}: FetchOptions{{/if}} = {}
){{#if types}}: UseFetchResult<T>{{/if}} {
  const [data, setData] = useState{{#if types}}<T | null>{{/if}}(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState{{#if types}}<Error | null>{{/if}}(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [url, options.method, options.headers, options.body]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

{{#if comments}}
/**
 * Example usage component
 */
{{/if}}
import React from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet } from 'react-native';

{{#if types}}
interface User {
  id: number;
  name: string;
  email: string;
}
{{/if}}

const {{componentName}} = () => {
  const { data, loading, error, refetch } = {{hookName}}{{#if types}}<User[]>{{/if}}(
    '{{apiEndpoint}}'
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data?.map((item) => (
        <Text key={item.id} style={styles.item}>
          {item.name}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export { {{hookName}} };
export default {{componentName}};`,
        dependencies: ['react-native'],
        imports: ['useState', 'useEffect', 'useCallback'],
        notes: [
            'Consider using React Query or SWR for production apps',
            'Add request cancellation for unmounted components',
            'Implement retry logic for transient failures'
        ]
    },

    // ============================================
    // Storage Patterns
    // ============================================
    'mmkv-storage': {
        id: 'mmkv-storage',
        name: 'MMKV Storage Hook',
        description: 'Type-safe MMKV storage hook with async-like API',
        library: 'react-native-mmkv',
        category: 'storage',
        language: 'typescript',
        code: `import { useCallback, useMemo } from 'react';
import { MMKV } from 'react-native-mmkv';

{{#if comments}}// Initialize MMKV storage instance{{/if}}
const storage = new MMKV();

{{#if types}}
interface UseStorageResult<T> {
  get: () => T | null;
  set: (value: T) => void;
  remove: () => void;
}
{{/if}}

{{#if comments}}
/**
 * {{hookName}} - Type-safe MMKV storage hook
 * Provides get, set, and remove operations for a storage key
 */
{{/if}}
function {{hookName}}{{#if types}}<T>{{/if}}(key{{#if types}}: string{{/if}}){{#if types}}: UseStorageResult<T>{{/if}} {
  const get = useCallback((){{#if types}}: T | null{{/if}} => {
    const value = storage.getString(key);
    if (value === undefined) return null;
    try {
      return JSON.parse(value){{#if types}} as T{{/if}};
    } catch {
      return value{{#if types}} as unknown as T{{/if}};
    }
  }, [key]);

  const set = useCallback((value{{#if types}}: T{{/if}}) => {
    storage.set(key, JSON.stringify(value));
  }, [key]);

  const remove = useCallback(() => {
    storage.delete(key);
  }, [key]);

  return useMemo(() => ({ get, set, remove }), [get, set, remove]);
}

{{#if comments}}
/**
 * Example: User preferences storage
 */
{{/if}}
{{#if types}}
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}
{{/if}}

const STORAGE_KEYS = {
  USER_PREFS: 'user_preferences',
  AUTH_TOKEN: 'auth_token',
} as const;

{{#if comments}}// Pre-configured hooks for common storage needs{{/if}}
const useUserPreferences = () => {{hookName}}{{#if types}}<UserPreferences>{{/if}}(STORAGE_KEYS.USER_PREFS);
const useAuthToken = () => {{hookName}}{{#if types}}<string>{{/if}}(STORAGE_KEYS.AUTH_TOKEN);

{{#if comments}}
/**
 * Example usage component
 */
{{/if}}
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

const {{componentName}} = () => {
  const prefs = useUserPreferences();
  const currentPrefs = prefs.get() || { theme: 'light', notifications: true, language: 'en' };

  const toggleDarkMode = () => {
    prefs.set({
      ...currentPrefs,
      theme: currentPrefs.theme === 'light' ? 'dark' : 'light',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>Dark Mode</Text>
        <Switch
          value={currentPrefs.theme === 'dark'}
          onValueChange={toggleDarkMode}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export { {{hookName}}, useUserPreferences, useAuthToken, STORAGE_KEYS };
export default {{componentName}};`,
        dependencies: ['react-native-mmkv'],
        imports: ['MMKV'],
        notes: [
            'MMKV is synchronous and much faster than AsyncStorage',
            'Consider encryption for sensitive data: new MMKV({ encryptionKey: "..." })',
            'Use separate MMKV instances for different data domains'
        ]
    },

    // ============================================
    // Animation Patterns
    // ============================================
    'reanimated-gesture': {
        id: 'reanimated-gesture',
        name: 'Reanimated Gesture Animation',
        description: 'Draggable component with Reanimated and Gesture Handler',
        library: 'react-native-reanimated',
        category: 'animation',
        language: 'typescript',
        code: `import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

{{#if comments}}
/**
 * {{componentName}} - Draggable animated component
 * Uses Reanimated 2 worklets and Gesture Handler for smooth 60fps animations
 */
{{/if}}
const {{componentName}} = () => {
  {{#if comments}}// Shared values run on the UI thread{{/if}}
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  {{#if comments}}// Store the starting position when gesture begins{{/if}}
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      {{#if comments}}// Save starting position{{/if}}
      startX.value = translateX.value;
      startY.value = translateY.value;
      {{#if comments}}// Scale up when dragging starts{{/if}}
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      {{#if comments}}// Update position based on gesture{{/if}}
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      {{#if comments}}// Spring back to original scale{{/if}}
      scale.value = withSpring(1);
    });

  {{#if comments}}// Animated style runs on UI thread via worklet{{/if}}
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.wrapper}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.box, animatedStyle]} />
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
});

export default {{componentName}};`,
        dependencies: ['react-native-reanimated', 'react-native-gesture-handler'],
        imports: ['useSharedValue', 'useAnimatedStyle', 'withSpring', 'Gesture', 'GestureDetector'],
        notes: [
            'All animation logic runs on the UI thread for 60fps performance',
            'Wrap your app root with GestureHandlerRootView',
            'Use worklets (functions with "worklet" directive) for complex UI thread logic'
        ]
    },

    'reanimated-spring': {
        id: 'reanimated-spring',
        name: 'Reanimated Spring Animation',
        description: 'Spring-based animations with Reanimated for natural motion',
        library: 'react-native-reanimated',
        category: 'animation',
        language: 'typescript',
        code: `import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

{{#if types}}
interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Spring animation examples
 * Demonstrates various spring configurations for natural motion
 */
{{/if}}
const {{componentName}} = () => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  {{#if comments}}// Bouncy spring configuration{{/if}}
  const bouncyConfig{{#if types}}: SpringConfig{{/if}} = {
    damping: 4,
    stiffness: 100,
    mass: 0.5,
  };

  {{#if comments}}// Smooth spring configuration{{/if}}
  const smoothConfig{{#if types}}: SpringConfig{{/if}} = {
    damping: 15,
    stiffness: 100,
    mass: 1,
  };

  const handlePress = () => {
    {{#if comments}}// Sequence: scale up, rotate, then reset{{/if}}
    scale.value = withSequence(
      withSpring(1.2, bouncyConfig),
      withSpring(1, smoothConfig)
    );

    rotation.value = withSequence(
      withSpring(10, bouncyConfig),
      withSpring(-10, bouncyConfig),
      withSpring(0, smoothConfig)
    );

    translateY.value = withSequence(
      withSpring(-20, bouncyConfig),
      withSpring(0, smoothConfig)
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: \`\${rotation.value}deg\` },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.box, animatedStyle]}>
          <Text style={styles.text}>Tap Me</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 120,
    height: 120,
    backgroundColor: '#5856D6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {{componentName}};`,
        dependencies: ['react-native-reanimated'],
        imports: ['useSharedValue', 'useAnimatedStyle', 'withSpring', 'withSequence', 'withTiming'],
        notes: [
            'Lower damping = more bouncy, higher damping = more smooth',
            'withSequence chains animations one after another',
            'Use withDelay to add pauses between animations'
        ]
    },

    // ============================================
    // Image Patterns
    // ============================================
    'skia-basic': {
        id: 'skia-basic',
        name: 'React Native Skia Basic',
        description: 'Basic Skia canvas with shapes and gradients',
        library: 'react-native-skia',
        category: 'image',
        language: 'typescript',
        code: `import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  RoundedRect,
  vec,
  Paint,
  BlurMask,
} from '@shopify/react-native-skia';

{{#if types}}
interface {{componentName}}Props {
  width?: number;
  height?: number;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Basic Skia canvas with shapes
 * Demonstrates gradients, shadows, and basic shapes
 */
{{/if}}
const {{componentName}} = ({{#if types}}{ width = 300, height = 300 }: {{componentName}}Props{{/if}}{{#unless types}}{ width = 300, height = 300 }{{/unless}}) => {
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        {{#if comments}}{/* Background rounded rectangle with gradient */}{{/if}}
        <RoundedRect x={20} y={20} width={width - 40} height={height - 40} r={16}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={['#667eea', '#764ba2']}
          />
        </RoundedRect>

        {{#if comments}}{/* Circle with blur shadow */}{{/if}}
        <Group>
          <Circle cx={centerX} cy={centerY} r={60} color="#fff" opacity={0.3}>
            <BlurMask blur={10} style="normal" />
          </Circle>
          <Circle cx={centerX} cy={centerY} r={50} color="#fff" />
        </Group>

        {{#if comments}}{/* Decorative circles */}{{/if}}
        <Circle cx={80} cy={80} r={30} color="rgba(255,255,255,0.2)" />
        <Circle cx={width - 80} cy={height - 80} r={40} color="rgba(255,255,255,0.15)" />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default {{componentName}};`,
        dependencies: ['@shopify/react-native-skia'],
        imports: ['Canvas', 'Circle', 'Group', 'LinearGradient', 'RoundedRect', 'vec', 'BlurMask'],
        notes: [
            'Skia provides GPU-accelerated 2D graphics',
            'Use vec() helper for creating points',
            'Combine with Reanimated for animated graphics'
        ]
    },

    'image-picker': {
        id: 'image-picker',
        name: 'Image Picker Component',
        description: 'Image selection from camera or gallery with preview',
        library: 'expo',
        category: 'image',
        language: 'typescript',
        code: `import React, { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

{{#if types}}
interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
}

interface {{componentName}}Props {
  onImageSelected?: (image: ImageAsset) => void;
  aspectRatio?: [number, number];
  allowsEditing?: boolean;
}
{{/if}}

{{#if comments}}
/**
 * {{componentName}} - Image picker with camera and gallery options
 * Handles permissions and provides image preview
 */
{{/if}}
const {{componentName}} = ({{#if types}}{
  onImageSelected,
  aspectRatio = [4, 3],
  allowsEditing = true,
}: {{componentName}}Props{{/if}}{{#unless types}}{
  onImageSelected,
  aspectRatio = [4, 3],
  allowsEditing = true,
}{{/unless}}) => {
  const [image, setImage] = useState{{#if types}}<ImageAsset | null>{{/if}}(null);

  const requestPermission = async (type{{#if types}}: 'camera' | 'gallery'{{/if}}) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickImage = async (useCamera{{#if types}}: boolean{{/if}} = false) => {
    const permissionType = useCamera ? 'camera' : 'gallery';
    const hasPermission = await requestPermission(permissionType);

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        \`Please grant \${permissionType} permission to continue.\`
      );
      return;
    }

    const options{{#if types}}: ImagePicker.ImagePickerOptions{{/if}} = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect: aspectRatio,
      quality: 0.8,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      const selectedImage = {
        uri: result.assets[0].uri,
        width: result.assets[0].width,
        height: result.assets[0].height,
        type: result.assets[0].type,
      }{{#if types}} as ImageAsset{{/if}};

      setImage(selectedImage);
      onImageSelected?.(selectedImage);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => pickImage(false)}
        >
          <Text style={styles.buttonText}>📷 Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => pickImage(true)}
        >
          <Text style={styles.buttonText}>📸 Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {{componentName}};`,
        dependencies: ['expo-image-picker'],
        imports: ['ImagePicker'],
        notes: [
            'Requires expo-image-picker package',
            'Always request permissions before accessing camera/gallery',
            'Use quality option to control file size'
        ]
    },
};

/**
 * Get a scaffold template by ID
 */
export function getScaffoldById(id: string): ComponentScaffold | undefined {
    return SCAFFOLD_TEMPLATES[id];
}

/**
 * Get all scaffolds in a category
 */
export function getScaffoldsByCategory(category: ScaffoldCategory): ComponentScaffold[] {
    return Object.values(SCAFFOLD_TEMPLATES).filter(s => s.category === category);
}

/**
 * Get all scaffolds for a library
 */
export function getScaffoldsByLibrary(library: string): ComponentScaffold[] {
    return Object.values(SCAFFOLD_TEMPLATES).filter(s => s.library === library);
}

/**
 * List all available scaffolds
 */
export function listAvailableScaffolds(): ComponentScaffold[] {
    return Object.values(SCAFFOLD_TEMPLATES);
}

/**
 * Convert TypeScript code to JavaScript by removing type annotations
 */
export function convertTypeScriptToJavaScript(code: string): string {
    return code
        // Remove type annotations from function parameters
        .replace(/:\s*[A-Za-z<>\[\]|&{}(),\s\n]+(?=\s*[,)\]=])/g, '')
        // Remove interface declarations
        .replace(/interface\s+\w+\s*{[^}]*}\n*/g, '')
        // Remove type declarations
        .replace(/type\s+\w+\s*=\s*[^;]+;\n*/g, '')
        // Remove generic type parameters
        .replace(/<[A-Za-z<>\[\]|&{},\s]+>/g, '')
        // Remove 'as Type' assertions
        .replace(/\s+as\s+\w+/g, '')
        // Remove import type statements
        .replace(/import\s+type\s+[^;]+;\n*/g, '')
        // Clean up double newlines
        .replace(/\n{3,}/g, '\n\n');
}

/**
 * Apply customizations to a template
 */
export function applyCustomizations(
    template: string,
    customizations: Record<string, string>
): string {
    let result = template;
    for (const [key, value] of Object.entries(customizations)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

/**
 * Process conditional blocks in template
 */
function processConditionals(
    template: string,
    options: { includeTypes: boolean; includeComments: boolean }
): string {
    let result = template;

    // Process {{#if types}}...{{/if}} blocks
    if (options.includeTypes) {
        result = result.replace(/{{#if types}}([\s\S]*?){{\/if}}/g, '$1');
        result = result.replace(/{{#unless types}}[\s\S]*?{{\/unless}}/g, '');
    } else {
        result = result.replace(/{{#if types}}[\s\S]*?{{\/if}}/g, '');
        result = result.replace(/{{#unless types}}([\s\S]*?){{\/unless}}/g, '$1');
    }

    // Process {{#if comments}}...{{/if}} blocks
    if (options.includeComments) {
        result = result.replace(/{{#if comments}}([\s\S]*?){{\/if}}/g, '$1');
    } else {
        result = result.replace(/{{#if comments}}[\s\S]*?{{\/if}}/g, '');
    }

    return result;
}

/**
 * Generate scaffold code with options
 */
export function generateScaffold(options: ScaffoldGenerationOptions): string {
    const scaffold = getScaffoldById(options.scaffoldId);
    if (!scaffold) {
        throw new Error(`Scaffold not found: ${options.scaffoldId}`);
    }

    let code = scaffold.code;

    // Apply default customizations
    const defaultCustomizations: Record<string, string> = {
        componentName: 'MyComponent',
        hookName: 'useFetch',
        itemType: 'Item',
        apiEndpoint: 'https://api.example.com/items',
    };

    const customizations = { ...defaultCustomizations, ...options.customizations };

    // Process conditionals
    code = processConditionals(code, {
        includeTypes: options.includeTypes && options.language === 'typescript',
        includeComments: options.includeComments,
    });

    // Apply customizations
    code = applyCustomizations(code, customizations);

    // Convert to JavaScript if needed
    if (options.language === 'javascript') {
        code = convertTypeScriptToJavaScript(code);
    }

    // Clean up any remaining template syntax
    code = code.replace(/{{[^}]+}}/g, '');

    return code;
}
