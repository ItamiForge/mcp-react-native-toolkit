/**
 * Template Registry for AI/Agentic Framework Configurations
 * 
 * Provides templates for various AI coding assistants and agentic frameworks
 * to help them understand React Native best practices and project context.
 */

export interface FrameworkConfig {
    id: string;
    name: string;
    description: string;
    outputFile: string;
    format: 'markdown' | 'json' | 'yaml' | 'toml' | 'text' | 'xml';
    category: 'ide-extension' | 'cli-tool' | 'web-platform' | 'other';
    website: string;
}

export interface GeneratedTemplate {
    framework: FrameworkConfig;
    content: string;
    outputPath: string;
}

/**
 * Registry of supported AI frameworks and their configuration formats
 * Based on Context7's comprehensive framework support
 */
export const FRAMEWORK_CONFIGS: FrameworkConfig[] = [
    // === IDE Extensions & Code Editors ===
    {
        id: 'cursor',
        name: 'Cursor',
        description: 'AI-powered IDE based on VS Code with built-in AI assistant. Rules in Cursor Settings > Rules or .cursorrules file',
        outputFile: '.cursorrules',
        format: 'text',
        category: 'ide-extension',
        website: 'https://cursor.sh'
    },
    {
        id: 'vscode-copilot',
        name: 'GitHub Copilot (VS Code)',
        description: 'GitHub Copilot integration for Visual Studio Code',
        outputFile: '.github/copilot-instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://github.com/features/copilot'
    },
    {
        id: 'windsurf',
        name: 'Windsurf (Codeium)',
        description: 'AI-powered IDE by Codeium with Cascade AI flows. Rules in .windsurfrules file',
        outputFile: '.windsurfrules',
        format: 'text',
        category: 'ide-extension',
        website: 'https://codeium.com/windsurf'
    },
    {
        id: 'kiro',
        name: 'Kiro (AWS)',
        description: 'AWS AI-powered IDE with spec-driven development. Navigate Kiro → MCP Servers to configure',
        outputFile: '.kiro/rules.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://kiro.dev'
    },
    {
        id: 'zed',
        name: 'Zed',
        description: 'High-performance, multiplayer code editor with AI integration. Install via Zed Extensions',
        outputFile: '.zed/settings.json',
        format: 'json',
        category: 'ide-extension',
        website: 'https://zed.dev'
    },
    {
        id: 'jetbrains',
        name: 'JetBrains AI Assistant',
        description: 'AI Assistant for JetBrains IDEs (IntelliJ, WebStorm, etc.). Settings → Tools → AI Assistant → MCP',
        outputFile: '.idea/ai-assistant.xml',
        format: 'xml',
        category: 'ide-extension',
        website: 'https://www.jetbrains.com/ai/'
    },
    {
        id: 'trae',
        name: 'Trae (ByteDance)',
        description: 'AI-native IDE by ByteDance with intelligent coding features',
        outputFile: '.trae/rules.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://trae.ai'
    },
    {
        id: 'vs2022',
        name: 'Visual Studio 2022',
        description: 'Microsoft Visual Studio with AI integration',
        outputFile: '.vs/copilot-instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://visualstudio.microsoft.com/'
    },
    {
        id: 'lm-studio',
        name: 'LM Studio',
        description: 'Desktop app for running local LLMs with MCP support',
        outputFile: '.lmstudio/instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://lmstudio.ai'
    },
    
    // === Agentic Coding Assistants (VS Code / IDE Extensions) ===
    {
        id: 'cline',
        name: 'Cline',
        description: 'Autonomous coding agent that can use CLI and edit files. Rules in .clinerules file',
        outputFile: '.clinerules',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://cline.bot'
    },
    {
        id: 'roo-code',
        name: 'Roo Code',
        description: 'AI coding assistant with autonomous capabilities and MCP support',
        outputFile: '.roo/rules.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://roocode.com'
    },
    {
        id: 'augment',
        name: 'Augment Code',
        description: 'AI-powered code assistant with deep codebase understanding. Hamburger menu → Settings → Tools',
        outputFile: '.augment/instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://augmentcode.com'
    },
    {
        id: 'continue',
        name: 'Continue',
        description: 'Open-source AI code assistant for VS Code and JetBrains',
        outputFile: '.continuerc.json',
        format: 'json',
        category: 'ide-extension',
        website: 'https://continue.dev'
    },
    {
        id: 'cody',
        name: 'Sourcegraph Cody',
        description: 'AI coding assistant with codebase context from Sourcegraph',
        outputFile: '.sourcegraph/cody.json',
        format: 'json',
        category: 'ide-extension',
        website: 'https://sourcegraph.com/cody'
    },
    {
        id: 'supermaven',
        name: 'Supermaven',
        description: 'Fast AI code completion with 1M token context window',
        outputFile: '.supermaven/rules.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://supermaven.com'
    },
    {
        id: 'tabnine',
        name: 'Tabnine',
        description: 'AI assistant for software developers with code completion',
        outputFile: '.tabnine.json',
        format: 'json',
        category: 'ide-extension',
        website: 'https://www.tabnine.com'
    },
    {
        id: 'amazon-q',
        name: 'Amazon Q Developer',
        description: 'AI coding companion from Amazon Web Services (formerly CodeWhisperer)',
        outputFile: '.aws/q-developer.json',
        format: 'json',
        category: 'ide-extension',
        website: 'https://aws.amazon.com/q/developer/'
    },
    {
        id: 'qodo-gen',
        name: 'Qodo Gen (CodiumAI)',
        description: 'AI code quality and test generation assistant',
        outputFile: '.qodo/instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://www.qodo.ai'
    },
    {
        id: 'zencoder',
        name: 'Zencoder',
        description: 'AI coding assistant with agent tools. Zencoder menu → Agent tools → Add custom MCP',
        outputFile: '.zencoder/instructions.md',
        format: 'markdown',
        category: 'ide-extension',
        website: 'https://zencoder.ai'
    },
    
    // === CLI & Terminal Tools ===
    {
        id: 'claude-code',
        name: 'Claude Code (CLI)',
        description: 'Anthropic Claude terminal-based coding agent. Rules in CLAUDE.md file',
        outputFile: 'CLAUDE.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://docs.anthropic.com/en/docs/claude-code'
    },
    {
        id: 'aider',
        name: 'Aider',
        description: 'AI pair programming in your terminal',
        outputFile: '.aider.conf.yml',
        format: 'yaml',
        category: 'cli-tool',
        website: 'https://aider.chat'
    },
    {
        id: 'codex-cli',
        name: 'OpenAI Codex CLI',
        description: 'OpenAI terminal coding assistant. Config in TOML format',
        outputFile: '.codex/config.toml',
        format: 'toml',
        category: 'cli-tool',
        website: 'https://github.com/openai/codex'
    },
    {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        description: 'Google Gemini terminal interface. Config in ~/.gemini/settings.json',
        outputFile: '.gemini/settings.json',
        format: 'json',
        category: 'cli-tool',
        website: 'https://github.com/google/gemini-cli'
    },
    {
        id: 'copilot-cli',
        name: 'GitHub Copilot CLI',
        description: 'GitHub Copilot in the terminal. Config in ~/.copilot/mcp-config.json',
        outputFile: '.copilot/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line'
    },
    {
        id: 'amp',
        name: 'Amp',
        description: 'Terminal-based AI coding assistant',
        outputFile: '.amp/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://amp.dev'
    },
    {
        id: 'warp',
        name: 'Warp',
        description: 'Modern terminal with AI integration. Settings → AI → Manage MCP servers',
        outputFile: '.warp/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://warp.dev'
    },
    {
        id: 'goose',
        name: 'Goose (Block)',
        description: 'Autonomous AI developer agent by Block',
        outputFile: '.goose/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://github.com/block/goose'
    },
    {
        id: 'mentat',
        name: 'Mentat',
        description: 'AI coding assistant that runs in terminal with codebase context',
        outputFile: '.mentat/config.yml',
        format: 'yaml',
        category: 'cli-tool',
        website: 'https://mentat.ai'
    },
    {
        id: 'plandex',
        name: 'Plandex',
        description: 'AI coding agent for complex tasks with version control',
        outputFile: '.plandex/context.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://plandex.ai'
    },
    {
        id: 'opencode',
        name: 'Opencode',
        description: 'Open-source AI coding assistant',
        outputFile: '.opencode/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://opencode.ai'
    },
    {
        id: 'rovo-dev',
        name: 'Rovo Dev CLI',
        description: 'Atlassian Rovo developer CLI. Config via acli rovodev mcp',
        outputFile: '.rovo/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://www.atlassian.com/software/rovo'
    },
    {
        id: 'factory',
        name: 'Factory (Droid)',
        description: 'Factory droid supports MCP servers. Use: droid mcp add',
        outputFile: '.factory/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://factory.ai'
    },
    {
        id: 'qwen-coder',
        name: 'Qwen Coder',
        description: 'Alibaba Qwen coding assistant. Config in ~/.qwen/settings.json',
        outputFile: '.qwen/settings.json',
        format: 'json',
        category: 'cli-tool',
        website: 'https://qwenlm.github.io/qwen-code-docs/'
    },
    
    // === Autonomous Agents ===
    {
        id: 'devin',
        name: 'Devin (Cognition)',
        description: 'Autonomous AI software engineer',
        outputFile: '.devin/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://cognition.ai'
    },
    {
        id: 'openhands',
        name: 'OpenHands (OpenDevin)',
        description: 'Open-source autonomous AI software developer',
        outputFile: '.openhands/instructions.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://github.com/All-Hands-AI/OpenHands'
    },
    {
        id: 'swe-agent',
        name: 'SWE-agent',
        description: 'Princeton AI agent for solving GitHub issues',
        outputFile: '.swe-agent/config.yml',
        format: 'yaml',
        category: 'cli-tool',
        website: 'https://swe-agent.com'
    },
    {
        id: 'sweep',
        name: 'Sweep',
        description: 'AI-powered junior developer that handles GitHub issues',
        outputFile: 'sweep.yaml',
        format: 'yaml',
        category: 'cli-tool',
        website: 'https://sweep.dev'
    },
    {
        id: 'gpt-engineer',
        name: 'GPT Engineer',
        description: 'AI agent that generates entire codebases from prompts',
        outputFile: '.gpt-engineer/context.md',
        format: 'markdown',
        category: 'cli-tool',
        website: 'https://gptengineer.app'
    },
    
    // === Web Platforms & Chat Interfaces ===
    {
        id: 'claude',
        name: 'Claude Projects',
        description: 'Anthropic Claude with custom project instructions in CLAUDE.md',
        outputFile: 'CLAUDE.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://claude.ai'
    },
    {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        description: 'Anthropic Claude Desktop app. Settings → Connectors → Add Custom Connector',
        outputFile: 'CLAUDE.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://claude.ai/download'
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT Projects',
        description: 'OpenAI ChatGPT with custom project instructions',
        outputFile: 'chatgpt-instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://chat.openai.com'
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google AI assistant with Gems custom instructions',
        outputFile: 'gemini-instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://gemini.google.com'
    },
    {
        id: 'perplexity',
        name: 'Perplexity Desktop',
        description: 'Perplexity AI desktop app. Settings → Connectors → Add Connector',
        outputFile: '.perplexity/instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://perplexity.ai'
    },
    {
        id: 'replit',
        name: 'Replit AI',
        description: 'AI assistant integrated into Replit online IDE',
        outputFile: '.replit-ai',
        format: 'text',
        category: 'web-platform',
        website: 'https://replit.com'
    },
    {
        id: 'v0',
        name: 'v0 (Vercel)',
        description: 'Vercel AI for generating React components',
        outputFile: 'v0-instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://v0.dev'
    },
    {
        id: 'bolt',
        name: 'Bolt.new (StackBlitz)',
        description: 'AI full-stack web development in the browser',
        outputFile: '.bolt/instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://bolt.new'
    },
    {
        id: 'lovable',
        name: 'Lovable (GPT Engineer)',
        description: 'AI web app builder from natural language',
        outputFile: 'lovable-instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://lovable.dev'
    },
    {
        id: 'pythagora',
        name: 'Pythagora (GPT Pilot)',
        description: 'AI developer that builds apps from scratch',
        outputFile: '.pythagora/context.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://pythagora.ai'
    },
    {
        id: 'boltai',
        name: 'BoltAI',
        description: 'Native macOS AI app. Settings → Plugins to configure MCP',
        outputFile: '.boltai/instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://boltai.com'
    },
    {
        id: 'crush',
        name: 'Crush',
        description: 'AI coding assistant with MCP support',
        outputFile: '.crush/instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://crush.dev'
    },
    {
        id: 'emdash',
        name: 'Emdash',
        description: 'AI-powered writing and coding assistant',
        outputFile: '.emdash/instructions.md',
        format: 'markdown',
        category: 'web-platform',
        website: 'https://emdash.ai'
    },
    
    // === GitHub Integration ===
    {
        id: 'copilot-agent',
        name: 'GitHub Copilot Coding Agent',
        description: 'GitHub Copilot agent for repositories. Repository → Settings → Copilot → Coding agent',
        outputFile: '.github/copilot-agent.md',
        format: 'markdown',
        category: 'other',
        website: 'https://docs.github.com/en/copilot'
    },
    
    // === Generic ===
    {
        id: 'generic',
        name: 'Generic AI Instructions',
        description: 'Universal AI assistant instructions in Markdown format',
        outputFile: 'ai-instructions.md',
        format: 'markdown',
        category: 'other',
        website: ''
    }
];

/**
 * Base instructions content shared across all frameworks
 */
const BASE_INSTRUCTIONS = {
    projectContext: `React Native/Expo Mobile Development Project

This project uses React Native and/or Expo for cross-platform mobile development. Follow these guidelines to provide accurate and helpful assistance.`,

    coreRules: [
        'Always detect project context before suggesting code (check package.json for versions)',
        'Verify APIs exist for the detected React Native/Expo version before suggesting',
        'Use TypeScript with proper type annotations unless the project uses JavaScript',
        'Follow React Native performance best practices (memo, useCallback, FlatList optimization)',
        'Prefer functional components with hooks over class components',
        'Handle platform differences when necessary using Platform.OS or platform-specific files'
    ],

    apiValidation: [
        'Check React Native version before using new APIs (e.g., useWindowDimensions requires RN 0.61+)',
        'Check Expo SDK version for Expo-specific APIs',
        'Verify third-party library versions (React Navigation, Reanimated, Gesture Handler, etc.)',
        'Use optional chaining and nullish coalescing for safer code',
        'Import from correct packages (react-native vs expo-* vs @react-navigation/*)'
    ],

    bestPractices: [
        'Use FlatList/SectionList for long lists, never ScrollView with many items',
        'Implement proper loading states and error handling',
        'Use React.memo() for pure components that render often',
        'Avoid inline functions in render for frequently re-rendering components',
        'Use StyleSheet.create() instead of inline styles for performance',
        'Handle keyboard avoiding behavior for forms',
        'Test on both iOS and Android platforms',
        'Use proper accessibility labels and hints'
    ],

    navigation: [
        'Use React Navigation for routing (@react-navigation/native)',
        'Properly type navigation props with TypeScript',
        'Use navigation.navigate() with proper screen names',
        'Handle deep linking when required',
        'Configure proper header options for screens'
    ],

    stateManagement: [
        'Use React Context for simple state sharing',
        'Consider Zustand, Jotai, or Redux Toolkit for complex state',
        'Use React Query or SWR for server state',
        'Persist state with MMKV or AsyncStorage as appropriate',
        'Avoid prop drilling more than 2-3 levels deep'
    ],

    codeExamples: {
        flatListOptimized: `// Optimized FlatList with proper performance settings
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
});`,

        navigationSetup: `// Type-safe React Navigation setup
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
}`,

        errorBoundary: `// Error Boundary for React Native
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
});`
    }
};

/**
 * Format content as Markdown
 */
function formatAsMarkdown(config: FrameworkConfig, includeExamples: boolean): string {
    const lines: string[] = [
        `# ${config.name} Instructions`,
        '',
        '## Project Context',
        '',
        BASE_INSTRUCTIONS.projectContext,
        '',
        '## Core Rules',
        '',
        ...BASE_INSTRUCTIONS.coreRules.map(rule => `- ${rule}`),
        '',
        '## API Validation',
        '',
        ...BASE_INSTRUCTIONS.apiValidation.map(rule => `- ${rule}`),
        '',
        '## Best Practices',
        '',
        ...BASE_INSTRUCTIONS.bestPractices.map(rule => `- ${rule}`),
        '',
        '## Navigation',
        '',
        ...BASE_INSTRUCTIONS.navigation.map(rule => `- ${rule}`),
        '',
        '## State Management',
        '',
        ...BASE_INSTRUCTIONS.stateManagement.map(rule => `- ${rule}`),
    ];

    if (includeExamples) {
        lines.push(
            '',
            '## Code Examples',
            '',
            '### Optimized FlatList',
            '',
            '```typescript',
            BASE_INSTRUCTIONS.codeExamples.flatListOptimized,
            '```',
            '',
            '### Navigation Setup',
            '',
            '```typescript',
            BASE_INSTRUCTIONS.codeExamples.navigationSetup,
            '```',
            '',
            '### Error Boundary',
            '',
            '```typescript',
            BASE_INSTRUCTIONS.codeExamples.errorBoundary,
            '```'
        );
    }

    return lines.join('\n');
}

/**
 * Format content as plain text (Cursor/Windsurf style)
 */
function formatAsText(config: FrameworkConfig, includeExamples: boolean): string {
    const lines: string[] = [
        BASE_INSTRUCTIONS.projectContext,
        '',
        '=== CORE RULES ===',
        '',
        ...BASE_INSTRUCTIONS.coreRules.map((rule, i) => `${i + 1}. ${rule}`),
        '',
        '=== API VALIDATION ===',
        '',
        ...BASE_INSTRUCTIONS.apiValidation.map((rule, i) => `${i + 1}. ${rule}`),
        '',
        '=== BEST PRACTICES ===',
        '',
        ...BASE_INSTRUCTIONS.bestPractices.map((rule, i) => `${i + 1}. ${rule}`),
        '',
        '=== NAVIGATION ===',
        '',
        ...BASE_INSTRUCTIONS.navigation.map((rule, i) => `${i + 1}. ${rule}`),
        '',
        '=== STATE MANAGEMENT ===',
        '',
        ...BASE_INSTRUCTIONS.stateManagement.map((rule, i) => `${i + 1}. ${rule}`),
    ];

    if (includeExamples) {
        lines.push(
            '',
            '=== CODE EXAMPLES ===',
            '',
            '--- Optimized FlatList ---',
            '',
            BASE_INSTRUCTIONS.codeExamples.flatListOptimized,
            '',
            '--- Navigation Setup ---',
            '',
            BASE_INSTRUCTIONS.codeExamples.navigationSetup
        );
    }

    return lines.join('\n');
}

/**
 * Format content as JSON
 */
function formatAsJSON(config: FrameworkConfig, includeExamples: boolean): string {
    const content: Record<string, unknown> = {
        name: config.name,
        version: '1.0.0',
        projectContext: BASE_INSTRUCTIONS.projectContext,
        rules: {
            core: BASE_INSTRUCTIONS.coreRules,
            apiValidation: BASE_INSTRUCTIONS.apiValidation,
            bestPractices: BASE_INSTRUCTIONS.bestPractices,
            navigation: BASE_INSTRUCTIONS.navigation,
            stateManagement: BASE_INSTRUCTIONS.stateManagement
        }
    };

    if (includeExamples) {
        content.examples = BASE_INSTRUCTIONS.codeExamples;
    }

    // Framework-specific adjustments
    if (config.id === 'continue') {
        return JSON.stringify({
            customInstructions: content.rules,
            contextProviders: ['codebase', 'docs'],
            models: [],
            tabAutocompleteOptions: {},
            projectContext: content.projectContext
        }, null, 2);
    }

    if (config.id === 'zed') {
        return JSON.stringify({
            assistant: {
                version: '2',
                default_model: {
                    provider: 'copilot_chat',
                    model: 'gpt-4o'
                },
                custom_instructions: BASE_INSTRUCTIONS.coreRules.join('\n')
            },
            projectContext: content.projectContext
        }, null, 2);
    }

    if (config.id === 'codewhisperer') {
        return JSON.stringify({
            version: '1.0',
            codeGuidelines: BASE_INSTRUCTIONS.coreRules.concat(BASE_INSTRUCTIONS.bestPractices),
            languageSettings: {
                typescript: { enabled: true },
                javascript: { enabled: true }
            },
            projectContext: content.projectContext
        }, null, 2);
    }

    if (config.id === 'tabnine') {
        return JSON.stringify({
            version: '1.0',
            customInstructions: BASE_INSTRUCTIONS.coreRules.join('. '),
            codeStyle: {
                preferTypeScript: true,
                useFunctionalComponents: true,
                useHooks: true
            },
            projectContext: content.projectContext
        }, null, 2);
    }

    if (config.id === 'cody') {
        return JSON.stringify({
            version: '1',
            customInstructions: BASE_INSTRUCTIONS.coreRules.concat(BASE_INSTRUCTIONS.bestPractices).join('\n'),
            context: {
                include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                exclude: ['node_modules/**', '.git/**', 'android/**', 'ios/**']
            },
            projectContext: content.projectContext
        }, null, 2);
    }

    return JSON.stringify(content, null, 2);
}

/**
 * Format content as YAML (for Aider)
 */
function formatAsYAML(config: FrameworkConfig, includeExamples: boolean): string {
    const lines: string[] = [
        '# Aider Configuration for React Native Project',
        '',
        '# Project context',
        'project_type: react-native',
        '',
        '# Custom system prompt additions',
        'system_prompt: |',
        `  ${BASE_INSTRUCTIONS.projectContext.split('\n').join('\n  ')}`,
        '',
        '  Core Rules:',
        ...BASE_INSTRUCTIONS.coreRules.map(rule => `  - ${rule}`),
        '',
        '  Best Practices:',
        ...BASE_INSTRUCTIONS.bestPractices.map(rule => `  - ${rule}`),
        '',
        '# Files to include in context',
        'include:',
        '  - "**/*.ts"',
        '  - "**/*.tsx"',
        '  - "**/*.js"',
        '  - "**/*.jsx"',
        '  - "package.json"',
        '  - "app.json"',
        '  - "tsconfig.json"',
        '',
        '# Files to exclude',
        'exclude:',
        '  - "node_modules/**"',
        '  - ".git/**"',
        '  - "android/**"',
        '  - "ios/**"',
        '  - "*.lock"',
        '',
        '# Auto commits',
        'auto_commits: true',
        'dirty_commits: false'
    ];

    return lines.join('\n');
}

/**
 * Format content as XML (for JetBrains)
 */
function formatAsXML(config: FrameworkConfig, includeExamples: boolean): string {
    const escapeXml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const rules = [...BASE_INSTRUCTIONS.coreRules, ...BASE_INSTRUCTIONS.bestPractices];

    const lines: string[] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<component name="AIAssistantConfiguration">',
        '  <option name="projectContext">',
        `    <value>${escapeXml(BASE_INSTRUCTIONS.projectContext)}</value>`,
        '  </option>',
        '  <option name="customInstructions">',
        '    <list>',
        ...rules.map(rule => `      <option value="${escapeXml(rule)}" />`),
        '    </list>',
        '  </option>',
        '  <option name="preferredLanguage" value="TypeScript" />',
        '  <option name="frameworkHints">',
        '    <list>',
        '      <option value="React Native" />',
        '      <option value="Expo" />',
        '      <option value="React Navigation" />',
        '    </list>',
        '  </option>',
        '</component>'
    ];

    return lines.join('\n');
}

/**
 * Generate a template for a specific framework
 */
export function generateTemplate(frameworkId: string, includeExamples: boolean = true): GeneratedTemplate | null {
    const config = FRAMEWORK_CONFIGS.find(f => f.id === frameworkId);
    if (!config) {
        return null;
    }

    let content: string;

    switch (config.format) {
        case 'markdown':
            content = formatAsMarkdown(config, includeExamples);
            break;
        case 'json':
            content = formatAsJSON(config, includeExamples);
            break;
        case 'yaml':
            content = formatAsYAML(config, includeExamples);
            break;
        case 'xml':
            content = formatAsXML(config, includeExamples);
            break;
        case 'text':
        default:
            content = formatAsText(config, includeExamples);
            break;
    }

    return {
        framework: config,
        content,
        outputPath: config.outputFile
    };
}

/**
 * Generate templates for all frameworks
 */
export function generateAllTemplates(includeExamples: boolean = true): GeneratedTemplate[] {
    return FRAMEWORK_CONFIGS
        .map(config => generateTemplate(config.id, includeExamples))
        .filter((t): t is GeneratedTemplate => t !== null);
}

/**
 * Get list of all supported frameworks
 */
export function listFrameworks(): FrameworkConfig[] {
    return FRAMEWORK_CONFIGS;
}

/**
 * Get a specific framework config by ID
 */
export function getFrameworkConfig(id: string): FrameworkConfig | undefined {
    return FRAMEWORK_CONFIGS.find(f => f.id === id);
}

/**
 * Format frameworks list for display
 */
export function formatFrameworksList(): string {
    const byCategory: Record<string, FrameworkConfig[]> = {};

    for (const config of FRAMEWORK_CONFIGS) {
        if (!byCategory[config.category]) {
            byCategory[config.category] = [];
        }
        byCategory[config.category].push(config);
    }

    const categoryLabels: Record<string, string> = {
        'ide-extension': '🔧 IDE Extensions',
        'cli-tool': '💻 CLI Tools',
        'web-platform': '🌐 Web Platforms',
        'other': '📄 Other'
    };

    const lines: string[] = ['# Supported AI Frameworks', ''];

    for (const [category, configs] of Object.entries(byCategory)) {
        lines.push(`## ${categoryLabels[category] || category}`, '');
        for (const config of configs) {
            lines.push(`### ${config.name}`);
            lines.push(`- **ID:** \`${config.id}\``);
            lines.push(`- **Output:** \`${config.outputFile}\``);
            lines.push(`- **Format:** ${config.format}`);
            lines.push(`- **Description:** ${config.description}`);
            if (config.website) {
                lines.push(`- **Website:** ${config.website}`);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}
