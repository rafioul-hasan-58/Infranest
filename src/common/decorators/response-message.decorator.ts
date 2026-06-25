import { SetMetadata } from '@nestjs/common';

// The key used to store/retrieve the message from route metadata
export const RESPONSE_MESSAGE_KEY = 'response_message';

// Usage: @ResponseMessage('User created successfully')
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
