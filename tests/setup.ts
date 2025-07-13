/**
 * Test setup file
 * Global test configuration and mocks for Cloudflare Workers environment
 */

// Mock crypto.getRandomValues for consistent testing
const mockCrypto = {
  getRandomValues: (arr: Uint8Array) => {
    // Use deterministic values for testing
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  },
  subtle: {
    importKey: () => Promise.resolve({}),
    deriveBits: () => {
      // Return consistent 32-byte hash for testing
      const result = new ArrayBuffer(32)
      const view = new Uint8Array(result)
      for (let i = 0; i < 32; i++) {
        view[i] = i % 256
      }
      return Promise.resolve(result)
    },
    sign: () => {
      // Return mock signature
      const result = new ArrayBuffer(256)
      const view = new Uint8Array(result)
      for (let i = 0; i < 256; i++) {
        view[i] = i % 256
      }
      return Promise.resolve(result)
    },
    digest: () => {
      // Return mock hash
      const result = new ArrayBuffer(32)
      const view = new Uint8Array(result)
      for (let i = 0; i < 32; i++) {
        view[i] = i % 256
      }
      return Promise.resolve(result)
    }
  }
}

// @ts-ignore - Global assignment for testing
globalThis.crypto = mockCrypto

// Mock TextEncoder/TextDecoder for Node.js environment
// @ts-ignore
if (!globalThis.TextEncoder) {
  // @ts-ignore
  globalThis.TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      // Use Web API approach for encoding
      const bytes = new Uint8Array(input.length)
      for (let i = 0; i < input.length; i++) {
        bytes[i] = input.charCodeAt(i)
      }
      return bytes
    }
  }
}

// @ts-ignore
if (!globalThis.TextDecoder) {
  // @ts-ignore
  globalThis.TextDecoder = class TextDecoder {
    decode(input: Uint8Array): string {
      return String.fromCharCode(...Array.from(input))
    }
  }
}

// Mock Request for Cloudflare Workers environment
if (!globalThis.Request) {
  // @ts-ignore
  globalThis.Request = class Request {
    url: string
    method: string
    headers: Map<string, string>
    body: string

    constructor(url: string, init?: any) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Map()
      
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string)
        })
      }
      
      this.body = init?.body || ''
    }

    async json() {
      return JSON.parse(this.body)
    }

    get(key: string) {
      return this.headers.get(key)
    }
  }
}

// Mock Response for Cloudflare Workers environment
if (!globalThis.Response) {
  // @ts-ignore
  globalThis.Response = class Response {
    status: number
    body: string
    headers: Map<string, string>

    constructor(body?: string, init?: any) {
      this.status = init?.status || 200
      this.body = body || ''
      this.headers = new Map()
      
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string)
        })
      }
    }

    async json() {
      return JSON.parse(this.body)
    }

    async text() {
      return this.body
    }
  }
}

// Mock btoa/atob for Node.js environment
if (!globalThis.btoa) {
  globalThis.btoa = function(str: string): string {
    return ((str: string) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
      let result = ''
      let i = 0
      while (i < str.length) {
        const a = str.charCodeAt(i++)
        const b = i < str.length ? str.charCodeAt(i++) : 0
        const c = i < str.length ? str.charCodeAt(i++) : 0
        const bitmap = (a << 16) | (b << 8) | c
        result += chars.charAt((bitmap >> 18) & 63) + chars.charAt((bitmap >> 12) & 63) + 
                  (i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=') + 
                  (i - 1 < str.length ? chars.charAt(bitmap & 63) : '=')
      }
      return result
    })(str)
  }
}

if (!globalThis.atob) {
  globalThis.atob = function(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let result = ''
    let i = 0
    str = str.replace(/[^A-Za-z0-9+/]/g, '')
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++))
      const encoded2 = chars.indexOf(str.charAt(i++))
      const encoded3 = chars.indexOf(str.charAt(i++))
      const encoded4 = chars.indexOf(str.charAt(i++))
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4
      result += String.fromCharCode((bitmap >> 16) & 255)
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255)
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255)
    }
    return result
  }
}

export {}
