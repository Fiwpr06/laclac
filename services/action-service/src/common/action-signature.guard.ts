import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ActionSignatureGuard implements CanActivate {
  private readonly REPLAY_ATTACK_WINDOW_MS = 30000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    
    const clientSignature = req.headers['x-action-signature'] as string;
    const timestampStr = req.headers['x-timestamp'] as string;
    
    if (!clientSignature || !timestampStr) {
      throw new UnauthorizedException('Thiếu x-action-signature hoặc x-timestamp header');
    }

    const timestamp = Number(timestampStr);
    if (isNaN(timestamp)) {
      throw new UnauthorizedException('Timestamp không hợp lệ');
    }
    
    if (Date.now() - timestamp > this.REPLAY_ATTACK_WINDOW_MS) {
      throw new UnauthorizedException('Request đã hết hạn (Phát hiện Replay Attack)');
    }

    const rawBodyBuffer = req.rawBody || Buffer.alloc(0);

    const secret = process.env['ACTION_SECRET'] || 'laclac-action-secret';
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBodyBuffer);
    hmac.update(`:${timestamp}`); 
    
    const expectedSignature = hmac.digest('hex');

    try {
        const clientSigBuffer = Buffer.from(clientSignature, 'hex');
        const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');

        if (
            clientSigBuffer.length !== expectedSigBuffer.length || 
            !crypto.timingSafeEqual(clientSigBuffer, expectedSigBuffer)
        ) {
            throw new UnauthorizedException('Chữ ký HMAC không hợp lệ');
        }
    } catch (e) {
        throw new UnauthorizedException('Chữ ký HMAC sai định dạng');
    }

    return true;
  }
}
