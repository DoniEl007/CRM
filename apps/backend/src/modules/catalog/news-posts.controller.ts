import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { NewsPostsService } from './news-posts.service.js';
import { CreateNewsPostDto, PublishNewsPostDto, UpdateNewsPostDto } from './dto/news-post.dto.js';

@Controller('news')
export class NewsPostsController {
  constructor(private readonly newsPostsService: NewsPostsService) {}

  @Public()
  @Get('public')
  findPublished() {
    return this.newsPostsService.findPublished();
  }

  @Public()
  @Get('public/:id')
  findPublishedOne(@Param('id') id: string) {
    return this.newsPostsService.findPublishedByIdOrFail(id);
  }

  @Get()
  @RequirePermission('website.edit')
  findAllForStaff() {
    return this.newsPostsService.findAllForStaff();
  }

  @Get(':id')
  @RequirePermission('website.edit')
  findOne(@Param('id') id: string) {
    return this.newsPostsService.findByIdOrFail(id);
  }

  @Post()
  @RequirePermission('website.edit')
  create(@Body() dto: CreateNewsPostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.newsPostsService.create(dto, user.userId);
  }

  @Patch(':id')
  @RequirePermission('website.edit')
  update(@Param('id') id: string, @Body() dto: UpdateNewsPostDto) {
    return this.newsPostsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('website.edit')
  setStatus(@Param('id') id: string, @Body() dto: PublishNewsPostDto) {
    return this.newsPostsService.setStatus(id, dto);
  }
}
