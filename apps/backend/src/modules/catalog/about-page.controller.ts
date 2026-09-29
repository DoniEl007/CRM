import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { AboutPageService } from './about-page.service.js';
import { UpdateAboutPageDto } from './dto/update-about-page.dto.js';

@Controller('about')
export class AboutPageController {
  constructor(private readonly aboutPageService: AboutPageService) {}

  @Public()
  @Get('public')
  getPublic() {
    return this.aboutPageService.getContent();
  }

  @Patch()
  @RequirePermission('website.edit')
  update(@Body() dto: UpdateAboutPageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aboutPageService.update(dto, user.userId);
  }
}
