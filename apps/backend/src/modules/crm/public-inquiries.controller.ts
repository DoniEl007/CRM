import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequestsService } from './requests.service.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';

// Public website contact form (TT §3.1): every inquiry is recorded
// automatically in the CRM as a new request.
@Controller('public/inquiries')
export class PublicInquiriesController {
  constructor(private readonly requestsService: RequestsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(@Body() dto: CreateInquiryDto) {
    const request = await this.requestsService.createFromWebsite(dto);
    return { id: request.id, status: request.status };
  }
}
