import { describe, it, expect } from '@jest/globals';
import { Chunker } from '../src/chunker.js';

describe('Chunker', () => {
    const chunker = new Chunker(200); // Smaller chunks for testing

    it('should chunk large markdown by headers', () => {
        const content = `
## Introduction
This is an introduction section with enough content to make it substantial.
We need this to be long enough to trigger chunking behavior.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Usage
Here's how to use it. This section also needs to be substantial enough.
We're adding more content here to ensure proper chunking.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Basic Example
Code example here. This subsection adds more content.
More lines to make it larger and trigger chunking.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Another Section
More content in this section to ensure we have multiple chunks.
This should definitely be enough content now.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Ut enim ad minim veniam, quis nostrud exercitation ullamco.
`;

        const chunks = chunker.chunk(content, 'test-lib', '1.0.0', 'test-topic');

        expect(chunks.length).toBeGreaterThanOrEqual(1);
        expect(chunks[0].library).toBe('test-lib');
        expect(chunks[0].version).toBe('1.0.0');

        if (chunks.length > 1) {
            expect(chunks[0].metadata.hasNextChunk).toBe(true);
            expect(chunks[1].metadata.hasPreviousChunk).toBe(true);
        }
    });

    it('should estimate tokens correctly', () => {
        const text = 'This is a test'; // ~14 chars = ~4 tokens
        const tokens = chunker.estimateTokens(text);

        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThan(10);
    });

    it('should extract code examples', () => {
        const content = `
Here's an example:

\`\`\`javascript
const x = 10;
\`\`\`

And another:

\`\`\`typescript
function test() {}
\`\`\`
`;

        const examples = chunker.extractCodeExamples(content);

        expect(examples).toHaveLength(2);
        expect(examples[0].language).toBe('javascript');
        expect(examples[1].language).toBe('typescript');
    });

    it('should preprocess markdown correctly', () => {
        const content = `
<!-- This is a comment -->
## Header

Content with   extra   spaces


and many blank lines
`;

        const preprocessed = chunker.preprocess(content, {
            stripComments: true,
            removeNavigation: false,
            minifyWhitespace: true
        });

        expect(preprocessed).not.toContain('<!--');
        expect(preprocessed.match(/\n{3,}/)).toBeNull(); // No more than 2 consecutive newlines
    });
});
