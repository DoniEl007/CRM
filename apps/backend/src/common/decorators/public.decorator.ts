import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public';

// Opts an endpoint out of the global JwtAuthGuard — use only for genuinely
// public routes (login, public website content, contact form).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
