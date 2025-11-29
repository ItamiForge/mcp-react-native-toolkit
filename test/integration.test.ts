/**
 * Integration test for MCP React Native Toolkit
 *
 * This is a basic smoke test that verifies the server can start
 * and respond to basic MCP protocol requests.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.join(__dirname, '../dist/index.js');

describe('MCP Server Integration', () => {
    let server: ChildProcess;
    let responses: string[] = [];

    const sendRequest = (request: object): Promise<object> => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timed out'));
            }, 5000);

            const handleData = (data: Buffer) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const response = JSON.parse(line);
                        if (response.id === (request as any).id) {
                            clearTimeout(timeout);
                            server.stdout?.off('data', handleData);
                            resolve(response);
                        }
                    } catch {
                        // Ignore non-JSON output
                    }
                }
            };

            server.stdout?.on('data', handleData);
            server.stdin?.write(JSON.stringify(request) + '\n');
        });
    };

    beforeAll((done) => {
        server = spawn('node', [SERVER_PATH], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Give server time to start
        setTimeout(done, 1000);
    });

    afterAll(() => {
        if (server) {
            server.kill();
        }
    });

    it('should list available tools', async () => {
        const response = await sendRequest({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
        }) as any;

        expect(response.result).toBeDefined();
        expect(response.result.tools).toBeInstanceOf(Array);

        const toolNames = response.result.tools.map((t: any) => t.name);
        expect(toolNames).toContain('detect-project-context');
        expect(toolNames).toContain('search-docs');
        expect(toolNames).toContain('get-library-docs');
        expect(toolNames).toContain('validate-api');
        expect(toolNames).toContain('find-examples');
        expect(toolNames).toContain('get-best-practices');
        expect(toolNames).toContain('resolve-library');
    });

    it('should resolve library names', async () => {
        const response = await sendRequest({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'resolve-library',
                arguments: {
                    query: 'rn'
                }
            }
        }) as any;

        expect(response.result).toBeDefined();
        expect(response.result.content).toBeInstanceOf(Array);
        expect(response.result.content[0].text).toContain('React Native');
    });

    it('should get best practices', async () => {
        const response = await sendRequest({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'get-best-practices',
                arguments: {
                    library: 'react-native'
                }
            }
        }) as any;

        expect(response.result).toBeDefined();
        expect(response.result.content).toBeInstanceOf(Array);
        // Should contain best practices JSON
        const text = response.result.content[0].text;
        expect(text).toContain('FlashList');
    });
});
