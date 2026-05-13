export interface BiometricsOptions {
  title?: string
  subtitle?: string
  description?: string
  cancelButtonText?: string
}

export type BiometricsResult = 'success' | 'failed' | 'error' | 'not-supported' | 'not-enrolled'

export class Biometrics {
  static isSupported(): boolean {
    return 'credentials' in navigator
  }

  static async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch {
      return false
    }
  }

  static async getPublicKeyCredentialCreationOptions(userId: string, userName: string): Promise<PublicKeyCredentialCreationOptions> {
    const challenge = this.generateChallenge()

    return {
      challenge,
      rp: {
        name: 'SchematicForge',
        id: window.location.hostname
      },
      user: {
        id: this.stringToArrayBuffer(userId),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      }
    }
  }

  static async getPublicKeyCredentialRequestOptions(challenge: ArrayBuffer): Promise<PublicKeyCredentialRequestOptions> {
    return {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: 'required',
      allowCredentials: []
    }
  }

  static async register(options?: BiometricsOptions): Promise<BiometricsResult> {
    if (!await this.isAvailable()) {
      return 'not-supported'
    }

    try {
      const userId = crypto.randomUUID()
      const userName = options?.title || 'User'

      const creationOptions = await this.getPublicKeyCredentialCreationOptions(userId, userName)
      const credential = await navigator.credentials.create({
        publicKey: creationOptions
      }) as PublicKeyCredential | null

      if (credential) {
        return 'success'
      }

      return 'failed'
    } catch (error) {
      console.error('Biometric registration failed:', error)
      return 'error'
    }
  }

  static async authenticate(options?: BiometricsOptions): Promise<BiometricsResult> {
    if (!await this.isAvailable()) {
      return 'not-supported'
    }

    try {
      const challenge = this.generateChallenge()
      const requestOptions = await this.getPublicKeyCredentialRequestOptions(challenge)

      const assertion = await navigator.credentials.get({
        publicKey: requestOptions
      }) as PublicKeyCredential | null

      if (assertion) {
        return 'success'
      }

      return 'failed'
    } catch (error) {
      console.error('Biometric authentication failed:', error)
      return 'error'
    }
  }

  private static generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return array.buffer
  }

  private static stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }

  private static arrayBufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  }
}

export async function authenticateWithBiometrics(): Promise<BiometricsResult> {
  return Biometrics.authenticate()
}

export async function registerBiometrics(): Promise<BiometricsResult> {
  return Biometrics.register()
}
