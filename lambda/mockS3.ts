import { mock } from 'bun:test'

interface PutObjectInput {
  Bucket: string
  Key: string
  Body: string
  ContentType: string
  CacheControl: string
}

// The Lambda runtime provides the AWS SDK, so it isn't installed locally.
// Replaces it with a client that records each object it's asked to put; call
// this before importing a handler, since handlers create their client on load.
export function mockS3() {
  const puts: PutObjectInput[] = []
  mock.module('@aws-sdk/client-s3', () => ({
    S3Client: class {
      async send(command: { input: PutObjectInput }) {
        puts.push(command.input)
      }
    },
    PutObjectCommand: class {
      constructor(readonly input: PutObjectInput) {}
    },
  }))
  return puts
}
